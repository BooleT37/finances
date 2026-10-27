import type { Dayjs } from 'dayjs';

import type { ImportedTransaction } from '~/features/transactions/importedTransaction';

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

export interface IBankConnector {
  startAuth(params: { redirectUrl: string; state: string }): Promise<string>;
  completeAuth(code: string): Promise<BankSession>;
  fetchTransactions(params: {
    accountUid: string;
    dateFrom: Dayjs;
  }): Promise<ImportedTransaction[]>;
  disconnect(sessionId: string): Promise<void>;
}
