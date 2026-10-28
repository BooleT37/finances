import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from 'node:http';

import type {
  EnableBankingAccount,
  EnableBankingTransaction,
} from '../../../src/features/import/BankConnector/EnableBankingClient';

/**
 * A stand-in for Enable Banking's API, so e2e tests never reach a real bank.
 * The app server is pointed at it with ENABLE_BANKING_API_URL. Tests set the
 * accounts and transactions it returns through setEnableBankingStub().
 */
export const ENABLE_BANKING_STUB_PORT = 3998;
export const ENABLE_BANKING_STUB_URL = `http://localhost:${ENABLE_BANKING_STUB_PORT}`;

export interface EnableBankingStubState {
  accounts: EnableBankingAccount[];
  transactions: EnableBankingTransaction[];
}

const defaultState = (): EnableBankingStubState => ({
  accounts: [{ uid: 'stub-account', currency: 'EUR', product: 'Main' }],
  transactions: [],
});

export async function setEnableBankingStub(state: EnableBankingStubState) {
  const response = await fetch(`${ENABLE_BANKING_STUB_URL}/__stub/state`, {
    method: 'POST',
    body: JSON.stringify(state),
  });
  if (!response.ok) {
    throw new Error(`Could not configure the Enable Banking stub`);
  }
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
  }
  return body ? JSON.parse(body) : undefined;
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

export function startEnableBankingStub(): Promise<Server> {
  let state = defaultState();
  let validUntil = '';

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', ENABLE_BANKING_STUB_URL);
    const route = `${req.method} ${url.pathname}`;

    if (route === 'POST /__stub/state') {
      state = (await readJson(req)) as EnableBankingStubState;
      return sendJson(res, 200, {});
    }
    if (route === 'POST /auth') {
      const body = (await readJson(req)) as {
        access: { valid_until: string };
        redirect_url: string;
        state: string;
      };
      validUntil = body.access.valid_until;
      const login = new URL('/__bank-login', ENABLE_BANKING_STUB_URL);
      login.searchParams.set('redirect_url', body.redirect_url);
      login.searchParams.set('state', body.state);
      return sendJson(res, 200, { url: login.toString() });
    }
    if (route === 'GET /__bank-login') {
      const callback = new URL(url.searchParams.get('redirect_url') ?? '');
      callback.searchParams.set('code', 'stub-code');
      callback.searchParams.set('state', url.searchParams.get('state') ?? '');
      res.writeHead(302, { Location: callback.toString() });
      return res.end();
    }
    if (route === 'POST /sessions') {
      return sendJson(res, 200, {
        session_id: 'stub-session',
        accounts: state.accounts,
        access: { valid_until: validUntil },
      });
    }
    if (req.method === 'DELETE' && url.pathname.startsWith('/sessions/')) {
      return sendJson(res, 200, {});
    }
    if (
      req.method === 'GET' &&
      /^\/accounts\/[^/]+\/transactions$/.test(url.pathname)
    ) {
      return sendJson(res, 200, {
        transactions: state.transactions,
        continuation_key: null,
      });
    }
    return sendJson(res, 404, {
      code: 404,
      message: `The Enable Banking stub has no ${route}`,
      error: 'NOT_FOUND',
    });
  });

  return new Promise((resolve) =>
    server.listen(ENABLE_BANKING_STUB_PORT, () => resolve(server)),
  );
}
