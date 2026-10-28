import dayjs from 'dayjs';
import Decimal from 'decimal.js';

import type { ImportedTransaction } from '~/features/import/importedTransaction';
import { hash } from '~/server/hash';

import { EnableBankingBankConnector } from './EnableBankingBankConnector';
import type { EnableBankingTransaction } from './EnableBankingClient';

const CARD_PAYMENT_MARKER = 'Kartenzahlung';
const DIRECT_DEBIT_MARKER = 'SEPA-BASISLASTSCHRIFT';
const BANK_OWN_COUNTERPARTIES = new Set(['Kontoführung', 'Rechnungsabschluss']);
const PURCHASE_TIME = /\b(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}:\d{2}\b/;

const collapseWhitespace = (text: string) => text.replace(/\s+/g, ' ').trim();

// Commerzbank sends no transaction type, so it's read from the payment text.
// Types are worded like the ones on Vivid's PDF statements.
function transactionType(
  tx: EnableBankingTransaction,
  counterpartyName: string,
  text: string,
): string {
  if (text.includes(CARD_PAYMENT_MARKER)) {
    return 'Card transaction';
  }
  if (text.includes(DIRECT_DEBIT_MARKER)) {
    return 'Direct debit';
  }
  if (BANK_OWN_COUNTERPARTIES.has(counterpartyName)) {
    return 'Fees and charges';
  }
  return tx.credit_debit_indicator === 'CRDT'
    ? 'Incoming transfer'
    : 'Outgoing transfer';
}

// The booking date is 1–4 days after a card purchase, while the payment text
// carries the purchase time itself.
function transactionDate(bookingDate: string, text: string, type: string) {
  const purchaseDate =
    type === 'Card transaction' ? PURCHASE_TIME.exec(text)?.[1] : undefined;
  return dayjs(purchaseDate ?? bookingDate);
}

// With two remittance entries, the first is the payment reference and the
// second the bank's own block (End-to-End-Ref, Mandatsref, …). A single entry
// is always that block.
const paymentReference = (remittance: string[]) =>
  remittance.length > 1 ? collapseWhitespace(remittance[0]!) : '';

export class CommerzbankBankConnector extends EnableBankingBankConnector {
  protected readonly aspspName = 'Commerzbank';

  protected toImportedTransactions(
    transactions: EnableBankingTransaction[],
  ): ImportedTransaction[] {
    const occurrences = new Map<string, number>();
    return transactions
      .filter((tx) => !new Decimal(tx.transaction_amount.amount).isZero())
      .map((tx) => {
        if (!tx.booking_date) {
          throw new Error(
            'Commerzbank returned a booked transaction without a booking date',
          );
        }
        const isDebit = tx.credit_debit_indicator === 'DBIT';
        const counterpartyName = collapseWhitespace(
          (isDebit ? tx.creditor?.name : tx.debtor?.name) ?? '',
        );
        const remittance = tx.remittance_information ?? [];
        const text = remittance.join('\n');
        const type = transactionType(tx, counterpartyName, text);
        const amount = new Decimal(tx.transaction_amount.amount).abs();

        // Commerzbank sends no transaction id, so the hash is built from the
        // row's content. Identical rows on the same day get counted apart.
        const content = {
          connector: 'COMMERZBANK',
          bookingDate: tx.booking_date,
          direction: tx.credit_debit_indicator,
          amount: amount.toString(),
          counterpartyName,
          remittance,
        };
        const contentHash = hash(content);
        const occurrence = occurrences.get(contentHash) ?? 0;
        occurrences.set(contentHash, occurrence + 1);

        return {
          date: transactionDate(tx.booking_date, text, type),
          type,
          description: [counterpartyName, paymentReference(remittance)]
            .filter(Boolean)
            .join(' '),
          amount: isDebit ? amount.negated() : amount,
          hash: hash({ ...content, occurrence }),
        };
      });
  }
}
