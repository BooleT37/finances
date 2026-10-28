import dayjs from 'dayjs';
import Decimal from 'decimal.js';

import type { ImportedTransaction } from '~/features/import/importedTransaction';
import { hash } from '~/server/hash';

import { EnableBankingBankConnector } from './EnableBankingBankConnector';
import type { EnableBankingTransaction } from './EnableBankingClient';

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

export class VividBankConnector extends EnableBankingBankConnector {
  protected readonly aspspName = 'Vivid Money';

  protected toImportedTransactions(transactions: EnableBankingTransaction[]) {
    return transactions.map(toImportedTransaction);
  }
}
