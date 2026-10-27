import dayjs from 'dayjs';
import Decimal from 'decimal.js';

import type { ImportedTransaction } from '~/features/import/importedTransaction';
import { hash } from '~/server/hash';
import { getToday } from '~/shared/utils/today';

import type { BankSession, IBankConnector } from './BankConnector';
import type {
  EnableBankingAccount,
  EnableBankingClient,
  EnableBankingTransaction,
} from './EnableBankingClient';

const ASPSP_NAME = 'Vivid Money';
const COUNTRY = 'DE';
// EBA's amended RTS (Article 10) caps a consent at 180 days, and so does
// Vivid's own maximum_consent_validity.
const CONSENT_DAYS = 180;

const accountLabel = (account: EnableBankingAccount) =>
  [account.product ?? account.name, account.account_id?.iban]
    .filter(Boolean)
    .join(' · ') || account.uid;

// Types are worded like the ones on Vivid's PDF statements.
function transactionType(
  tx: EnableBankingTransaction,
  counterpartyName: string,
  ownName: string,
): string {
  const { description, code, sub_code } = tx.bank_transaction_code ?? {};
  if (code === 'CCRD') {
    return 'Card transaction';
  }
  if (sub_code === 'FEES') {
    return 'Fees and charges';
  }
  if (sub_code === 'BOOK' && counterpartyName === ownName) {
    return 'Transfer between own accounts';
  }
  if (code === 'IRCT' || code === 'RRCT' || code === 'ICDT') {
    return tx.credit_debit_indicator === 'CRDT'
      ? 'Incoming transfer'
      : 'Outgoing transfer';
  }
  return [description, code, sub_code].filter(Boolean).join('/');
}

function toImportedTransaction(
  tx: EnableBankingTransaction,
): ImportedTransaction {
  if (!tx.entry_reference || !tx.booking_date) {
    throw new Error('Vivid returned a booked transaction without a reference');
  }
  const isDebit = tx.credit_debit_indicator === 'DBIT';
  const counterpartyName =
    (isDebit ? tx.creditor?.name : tx.debtor?.name)?.trim() ?? '';
  const ownName = (isDebit ? tx.debtor?.name : tx.creditor?.name)?.trim() ?? '';
  const amount = new Decimal(tx.transaction_amount.amount).abs();
  return {
    date: dayjs(tx.booking_date),
    type: transactionType(tx, counterpartyName, ownName),
    description: [counterpartyName, ...(tx.remittance_information ?? [])]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(' '),
    amount: isDebit ? amount.negated() : amount,
    hash: hash({ connector: 'VIVID', entryReference: tx.entry_reference }),
  };
}

export class VividBankConnector implements IBankConnector {
  constructor(private readonly client: EnableBankingClient) {}

  async startAuth(params: { redirectUrl: string; state: string }) {
    const { url } = await this.client.startAuth({
      aspspName: ASPSP_NAME,
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
  }) {
    const transactions = await this.client.fetchTransactions(
      params.accountUid,
      params.dateFrom,
    );
    return transactions
      .filter((tx) => tx.status === 'BOOK')
      .map(toImportedTransaction);
  }

  async disconnect(sessionId: string) {
    await this.client.deleteSession(sessionId);
  }
}
