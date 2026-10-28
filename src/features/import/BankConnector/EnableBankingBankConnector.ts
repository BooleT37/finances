import dayjs from 'dayjs';

import type { ImportedTransaction } from '~/features/import/importedTransaction';
import { getToday } from '~/shared/utils/today';

import type { BankSession, BankUser, IBankConnector } from './BankConnector';
import type {
  EnableBankingAccount,
  EnableBankingClient,
  EnableBankingTransaction,
} from './EnableBankingClient';

const COUNTRY = 'DE';
// EBA's amended RTS (Article 10) caps a consent at 180 days, and so does
// every bank's own maximum_consent_validity so far.
const CONSENT_DAYS = 180;

const accountLabel = (account: EnableBankingAccount) =>
  [account.product ?? account.name, account.account_id?.iban]
    .filter(Boolean)
    .join(' · ') || account.uid;

export abstract class EnableBankingBankConnector implements IBankConnector {
  protected abstract readonly aspspName: string;

  constructor(private readonly client: EnableBankingClient) {}

  protected abstract toImportedTransactions(
    transactions: EnableBankingTransaction[],
  ): ImportedTransaction[];

  async startAuth(params: { redirectUrl: string; state: string }) {
    const { url } = await this.client.startAuth({
      aspspName: this.aspspName,
      country: COUNTRY,
      psuType: 'personal',
      redirectUrl: params.redirectUrl,
      state: params.state,
      validUntil: getToday().add(CONSENT_DAYS, 'day'),
    });
    return url;
  }

  async completeAuth(code: string): Promise<BankSession> {
    const session = await this.client.createSession(code);
    const validUntil = session.access?.valid_until;
    if (!validUntil) {
      throw new Error('Enable Banking returned a session without valid_until');
    }
    return {
      sessionId: session.session_id,
      accounts: session.accounts.map((account) => ({
        uid: account.uid,
        currency: account.currency ?? null,
        label: accountLabel(account),
      })),
      expiresAt: dayjs(validUntil),
    };
  }

  async fetchTransactions(params: {
    accountUid: string;
    dateFrom: dayjs.Dayjs;
    user: BankUser;
  }) {
    const transactions = await this.client.fetchTransactions(
      params.accountUid,
      params.dateFrom,
      params.user,
    );
    return this.toImportedTransactions(
      transactions.filter((tx) => tx.status === 'BOOK'),
    );
  }

  async disconnect(sessionId: string) {
    await this.client.deleteSession(sessionId);
  }
}
