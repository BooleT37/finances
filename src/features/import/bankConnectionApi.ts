import { randomUUID } from 'node:crypto';

import { createServerFn } from '@tanstack/react-start';
import {
  deleteCookie,
  getCookie,
  getRequestHost,
  setCookie,
} from '@tanstack/react-start/server';
import dayjs from 'dayjs';

import { adminMiddleware } from '~/middlewares/adminMiddleware';
import { authMiddleware } from '~/middlewares/authMiddleware';
import { trackInput } from '~/middlewares/tracking/trackInput';
import { prisma } from '~/server/db';
import { assertOwnedByProject } from '~/shared/utils/assertOwnedByProject';

import {
  BANK_CALLBACK_PATH,
  type BankAccount,
  bankConnectionSchema,
  type BankConnectionSourceInput,
  bankConnectionSourceSchema,
  type CompleteBankAuthInput,
  completeBankAuthSchema,
  type SelectBankAccountInput,
  selectBankAccountSchema,
} from './bankConnectionSchema';
import { createBankConnector } from './BankConnector/bankConnectorRegistry';
import { getEnableBankingCredentials } from './BankConnector/enableBankingCredentials';

const BANK_AUTH_COOKIE = 'bank-auth';
const BANK_AUTH_COOKIE_MAX_AGE_SECONDS = 15 * 60;

function requireEnableBankingCredentials(projectId: string) {
  const credentials = getEnableBankingCredentials(projectId);
  if (!credentials) {
    throw new Error('Bank connections are not available for this project');
  }
  return credentials;
}

export const fetchBankImportAvailable = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(
    ({ context }) => getEnableBankingCredentials(context.projectId) !== null,
  );

export const fetchBankConnections = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const connections = await prisma.bankConnection.findMany({
      where: { projectId: context.projectId },
    });
    return connections.map((connection) =>
      bankConnectionSchema.encode({
        sourceId: connection.sourceId,
        expiresAt: dayjs(connection.expiresAt),
        lastImportedAt: connection.lastImportedAt
          ? dayjs(connection.lastImportedAt)
          : null,
        hasAccount: connection.accountUid !== null,
      }),
    );
  });

export const startBankAuth = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware, trackInput<BankConnectionSourceInput>()])
  .validator((input: BankConnectionSourceInput) =>
    bankConnectionSourceSchema.parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertOwnedByProject(
      prisma.source,
      data.sourceId,
      context.projectId,
      'Source',
    );
    const credentials = requireEnableBankingCredentials(context.projectId);
    const state = randomUUID();
    setCookie(
      BANK_AUTH_COOKIE,
      JSON.stringify({ state, sourceId: data.sourceId }),
      {
        httpOnly: true,
        secure: true,
        // Lax, not Strict: the bank sends the browser back with a cross-site
        // top-level redirect, which a Strict cookie would not survive.
        sameSite: 'lax',
        path: '/',
        maxAge: BANK_AUTH_COOKIE_MAX_AGE_SECONDS,
      },
    );
    return createBankConnector('VIVID', credentials).startAuth({
      redirectUrl: `https://${getRequestHost()}${BANK_CALLBACK_PATH}`,
      state,
    });
  });

export const completeBankAuth = createServerFn({ method: 'POST' })
  .middleware([
    adminMiddleware,
    trackInput<CompleteBankAuthInput>({ code: 'omit', state: 'omit' }),
  ])
  .validator((input: CompleteBankAuthInput) =>
    completeBankAuthSchema.parse(input),
  )
  .handler(async ({ data, context }) => {
    const cookie = getCookie(BANK_AUTH_COOKIE);
    deleteCookie(BANK_AUTH_COOKIE, { path: '/' });
    const pending = cookie
      ? (JSON.parse(cookie) as { state: string; sourceId: number })
      : null;
    if (!pending || pending.state !== data.state) {
      throw new Error('This bank login was not started here, or it expired');
    }
    await assertOwnedByProject(
      prisma.source,
      pending.sourceId,
      context.projectId,
      'Source',
    );
    const connector = createBankConnector(
      'VIVID',
      requireEnableBankingCredentials(context.projectId),
    );
    const session = await connector.completeAuth(data.code);
    const eurAccounts = session.accounts.filter(
      (account) => account.currency === 'EUR',
    );
    if (eurAccounts.length === 0) {
      await connector.disconnect(session.sessionId);
      throw new Error('The bank returned no EUR accounts');
    }
    const accountUid = eurAccounts.length === 1 ? eurAccounts[0]!.uid : null;

    const previous = await prisma.$transaction(async (tx) => {
      const existing = await tx.bankConnection.findUnique({
        where: {
          sourceId_projectId: {
            sourceId: pending.sourceId,
            projectId: context.projectId,
          },
        },
      });
      const connection = {
        connector: 'VIVID' as const,
        sessionId: session.sessionId,
        accountUid,
        expiresAt: session.expiresAt.toDate(),
      };
      await tx.bankConnection.upsert({
        where: {
          sourceId_projectId: {
            sourceId: pending.sourceId,
            projectId: context.projectId,
          },
        },
        create: {
          ...connection,
          sourceId: pending.sourceId,
          projectId: context.projectId,
        },
        update: connection,
      });
      return existing;
    });
    if (previous) {
      await connector.disconnect(previous.sessionId).catch((error: unknown) => {
        console.warn('Could not close the replaced bank session', error);
      });
    }

    const accounts: BankAccount[] =
      accountUid === null
        ? eurAccounts.map(({ uid, label }) => ({ uid, label }))
        : [];
    return { sourceId: pending.sourceId, accounts };
  });

export const selectBankAccount = createServerFn({ method: 'POST' })
  .middleware([
    adminMiddleware,
    trackInput<SelectBankAccountInput>({ accountUid: 'omit' }),
  ])
  .validator((input: SelectBankAccountInput) =>
    selectBankAccountSchema.parse(input),
  )
  .handler(async ({ data, context }) => {
    await prisma.bankConnection.update({
      where: {
        sourceId_projectId: {
          sourceId: data.sourceId,
          projectId: context.projectId,
        },
      },
      data: { accountUid: data.accountUid },
    });
  });

export const disconnectBankConnection = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware, trackInput<BankConnectionSourceInput>()])
  .validator((input: BankConnectionSourceInput) =>
    bankConnectionSourceSchema.parse(input),
  )
  .handler(async ({ data, context }) => {
    const connection = await prisma.bankConnection.delete({
      where: {
        sourceId_projectId: {
          sourceId: data.sourceId,
          projectId: context.projectId,
        },
      },
    });
    const credentials = getEnableBankingCredentials(context.projectId);
    if (credentials) {
      await createBankConnector(connection.connector, credentials)
        .disconnect(connection.sessionId)
        .catch((error: unknown) => {
          console.warn('Could not close the bank session', error);
        });
    }
  });
