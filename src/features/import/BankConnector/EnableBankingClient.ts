import { createSign } from 'node:crypto';

import type { Dayjs } from 'dayjs';

import { ISO_DATE_FORMAT } from '~/shared/constants';

import type { BankUser } from './BankConnector';

export const ENABLE_BANKING_API_URL = 'https://api.enablebanking.com';
const JWT_LIFETIME_SECONDS = 3600;

const SESSION_GONE_ERRORS = new Set([
  'EXPIRED_SESSION',
  'CLOSED_SESSION',
  'REVOKED_SESSION',
  'SESSION_DOES_NOT_EXIST',
]);

export interface EnableBankingCredentials {
  applicationId: string;
  privateKey: string;
  apiUrl: string;
}

export interface EnableBankingAccount {
  uid: string;
  currency?: string | null;
  name?: string | null;
  product?: string | null;
  account_id?: { iban?: string | null } | null;
}

interface EnableBankingSession {
  session_id: string;
  accounts: EnableBankingAccount[];
  access?: { valid_until?: string } | null;
}

interface EnableBankingParty {
  name?: string | null;
}

export interface EnableBankingTransaction {
  entry_reference?: string | null;
  transaction_amount: { currency: string; amount: string };
  credit_debit_indicator: 'CRDT' | 'DBIT';
  status: string;
  booking_date?: string | null;
  creditor?: EnableBankingParty | null;
  debtor?: EnableBankingParty | null;
  remittance_information?: string[] | null;
  bank_transaction_code?: {
    description?: string | null;
    code?: string | null;
    sub_code?: string | null;
  } | null;
}

interface EnableBankingTransactionsPage {
  transactions: EnableBankingTransaction[];
  continuation_key?: string | null;
}

export class EnableBankingApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | null,
    message: string,
  ) {
    super(message);
    this.name = 'EnableBankingApiError';
  }
}

export const isSessionGoneError = (error: unknown) =>
  error instanceof EnableBankingApiError &&
  error.code !== null &&
  SESSION_GONE_ERRORS.has(error.code);

const base64url = (value: string) => Buffer.from(value).toString('base64url');

export class EnableBankingClient {
  constructor(private readonly credentials: EnableBankingCredentials) {}

  startAuth(params: {
    aspspName: string;
    country: string;
    psuType: 'personal' | 'business';
    redirectUrl: string;
    state: string;
    validUntil: Dayjs;
  }) {
    return this.request<{ url: string }>('POST', '/auth', {
      access: { valid_until: params.validUntil.toISOString() },
      aspsp: { name: params.aspspName, country: params.country },
      psu_type: params.psuType,
      redirect_url: params.redirectUrl,
      state: params.state,
    });
  }

  async createSession(code: string) {
    const session = await this.request<EnableBankingSession>(
      'POST',
      '/sessions',
      { code },
    );
    if (session.access?.valid_until) {
      return session;
    }
    const { access } = await this.request<Pick<EnableBankingSession, 'access'>>(
      'GET',
      `/sessions/${session.session_id}`,
    );
    return { ...session, access };
  }

  async deleteSession(sessionId: string) {
    await this.request('DELETE', `/sessions/${sessionId}`);
  }

  async fetchTransactions(accountUid: string, dateFrom: Dayjs, user: BankUser) {
    const transactions: EnableBankingTransaction[] = [];
    let continuationKey: string | null | undefined;
    do {
      const query = new URLSearchParams({
        date_from: dateFrom.format(ISO_DATE_FORMAT),
      });
      if (continuationKey) {
        query.set('continuation_key', continuationKey);
      }
      const page = await this.request<EnableBankingTransactionsPage>(
        'GET',
        `/accounts/${accountUid}/transactions?${query.toString()}`,
        undefined,
        psuHeaders(user),
      );
      transactions.push(...page.transactions);
      continuationKey = page.continuation_key;
    } while (continuationKey);
    return transactions;
  }

  private buildJwt(): string {
    const issuedAt = Math.floor(Date.now() / 1000);
    const header = base64url(
      JSON.stringify({
        typ: 'JWT',
        alg: 'RS256',
        kid: this.credentials.applicationId,
      }),
    );
    const payload = base64url(
      JSON.stringify({
        iss: 'enablebanking.com',
        aud: 'api.enablebanking.com',
        iat: issuedAt,
        exp: issuedAt + JWT_LIFETIME_SECONDS,
      }),
    );
    const signer = createSign('RSA-SHA256');
    signer.update(`${header}.${payload}`);
    return `${header}.${payload}.${signer.sign(this.credentials.privateKey, 'base64url')}`;
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'DELETE',
    path: string,
    body?: unknown,
    headers: Record<string, string> = {},
  ): Promise<T> {
    const response = await fetch(`${this.credentials.apiUrl}${path}`, {
      method,
      headers: {
        ...headers,
        Authorization: `Bearer ${this.buildJwt()}`,
        'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    if (!response.ok) {
      const error = parseErrorBody(text);
      throw new EnableBankingApiError(
        response.status,
        error.error,
        `Enable Banking ${method} ${path.split('?')[0]} failed with ${response.status}: ${error.message}`,
      );
    }
    return (text ? JSON.parse(text) : undefined) as T;
  }
}

// PSU headers tell the bank the account holder is making the request. Without
// them it counts as background access, which PSD2 limits to 4 a day.
function psuHeaders(user: BankUser): Record<string, string> {
  const headers: Record<string, string> = {};
  if (user.ipAddress) {
    headers['Psu-Ip-Address'] = user.ipAddress;
  }
  if (user.userAgent) {
    headers['Psu-User-Agent'] = user.userAgent;
  }
  return headers;
}

function parseErrorBody(text: string): {
  error: string | null;
  message: string;
} {
  try {
    const body = JSON.parse(text) as { error?: unknown; message?: unknown };
    return {
      error: typeof body.error === 'string' ? body.error : null,
      message: typeof body.message === 'string' ? body.message : text,
    };
  } catch {
    return { error: null, message: text };
  }
}
