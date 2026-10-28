import { generateKeyPairSync } from 'node:crypto';

import dayjs from 'dayjs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  EnableBankingApiError,
  EnableBankingClient,
  isSessionGoneError,
} from './EnableBankingClient';

const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });

const client = new EnableBankingClient({
  applicationId: 'app',
  privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
  apiUrl: 'https://bank.test',
});

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('EnableBankingClient.fetchTransactions', () => {
  it('follows the continuation key until the last page', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(200, {
          transactions: [{ entry_reference: 'first' }],
          continuation_key: 'next-page',
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          transactions: [{ entry_reference: 'second' }],
          continuation_key: null,
        }),
      );
    vi.stubGlobal('fetch', fetchMock);

    const transactions = await client.fetchTransactions(
      'account',
      dayjs('2026-10-01'),
      { ipAddress: '203.0.113.7', userAgent: 'Test browser' },
    );

    expect(transactions.map((tx) => tx.entry_reference)).toEqual([
      'first',
      'second',
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [firstUrl] = fetchMock.mock.calls[0] as [string];
    const [secondUrl] = fetchMock.mock.calls[1] as [string];
    expect(firstUrl).toBe(
      'https://bank.test/accounts/account/transactions?date_from=2026-10-01',
    );
    expect(secondUrl).toContain('continuation_key=next-page');
    const [, firstInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(firstInit.headers).toMatchObject({
      'Psu-Ip-Address': '203.0.113.7',
      'Psu-User-Agent': 'Test browser',
    });
  });
});

describe('EnableBankingClient errors', () => {
  it('turns an error response into an error carrying its code', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(401, {
          code: 401,
          message: 'Session expired',
          error: 'EXPIRED_SESSION',
        }),
      ),
    );

    const error = await client.deleteSession('session').catch((e) => e);

    expect(error).toBeInstanceOf(EnableBankingApiError);
    expect(error).toMatchObject({ status: 401, code: 'EXPIRED_SESSION' });
  });

  it.each([
    'EXPIRED_SESSION',
    'CLOSED_SESSION',
    'REVOKED_SESSION',
    'SESSION_DOES_NOT_EXIST',
  ])('treats %s as a session that is gone', (code) => {
    expect(
      isSessionGoneError(new EnableBankingApiError(401, code, 'message')),
    ).toBe(true);
  });

  it('does not treat other errors as a session that is gone', () => {
    expect(
      isSessionGoneError(new EnableBankingApiError(422, 'ACCESS_DENIED', 'm')),
    ).toBe(false);
    expect(isSessionGoneError(new Error('network down'))).toBe(false);
  });
});
