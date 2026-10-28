import type { Dayjs } from 'dayjs';

import type { ImportedTransaction } from '~/features/import/importedTransaction';

export interface BankAccount {
  uid: string;
  currency: string | null;
  label: string;
}

export interface BankSession {
  sessionId: string;
  accounts: BankAccount[];
  expiresAt: Dayjs;
}

export interface BankUser {
  ipAddress: string | null;
  userAgent: string | null;
}

export interface IBankConnector {
  startAuth(params: { redirectUrl: string; state: string }): Promise<string>;
  completeAuth(code: string): Promise<BankSession>;
  fetchTransactions(params: {
    accountUid: string;
    dateFrom: Dayjs;
    user: BankUser;
  }): Promise<ImportedTransaction[]>;
  disconnect(sessionId: string): Promise<void>;
}
