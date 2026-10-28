import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import { ISO_DATE_FORMAT } from '~/shared/constants';

import { CommerzbankBankConnector } from './CommerzbankBankConnector';
import type {
  EnableBankingClient,
  EnableBankingTransaction,
} from './EnableBankingClient';

const NO_USER = { ipAddress: null, userAgent: null };

function transaction(
  overrides: Partial<EnableBankingTransaction> = {},
): EnableBankingTransaction {
  return {
    transaction_amount: { currency: 'EUR', amount: '12.50' },
    credit_debit_indicator: 'DBIT',
    status: 'BOOK',
    booking_date: '2026-10-05',
    creditor: { name: 'REWE Markt Musterstr. 1 Berlin DE' },
    debtor: null,
    remittance_information: [
      'REWE Markt/Musterstr. 1/Berlin\n2026-10-02T18:04:11 KFN 1  VJ 2912\nKartenzahlung',
    ],
    bank_transaction_code: null,
    ...overrides,
  };
}

const directDebit = (overrides: Partial<EnableBankingTransaction> = {}) =>
  transaction({
    creditor: { name: 'Power Company GmbH' },
    remittance_information: [
      'Customer   no. 123  invoice 456',
      'Power Company GmbH\nCustomer no. 123\nEnd-to-End-Ref.: abc\nMandatsref: M-1\nGläubiger-ID:\nDE00ZZZ00000000000\nSEPA-BASISLASTSCHRIFT wiederholend',
    ],
    ...overrides,
  });

const fetchAll = (transactions: EnableBankingTransaction[]) =>
  new CommerzbankBankConnector({
    fetchTransactions: async () => transactions,
  } as unknown as EnableBankingClient).fetchTransactions({
    accountUid: 'account',
    dateFrom: dayjs('2026-10-01'),
    user: NO_USER,
  });

const importOne = async (tx: EnableBankingTransaction) => {
  const [row] = await fetchAll([tx]);
  return row!;
};

describe('CommerzbankBankConnector.fetchTransactions', () => {
  it('dates a card payment by its purchase time, not its booking date', async () => {
    const row = await importOne(transaction());

    expect(row.type).toBe('Card transaction');
    expect(row.date.format(ISO_DATE_FORMAT)).toBe('2026-10-02');
    expect(row.amount.toString()).toBe('-12.5');
    expect(row.description).toBe('REWE Markt Musterstr. 1 Berlin DE');
  });

  it('dates a card payment by its booking date when the text has no purchase time', async () => {
    const row = await importOne(
      transaction({ remittance_information: ['REWE Markt\nKartenzahlung'] }),
    );

    expect(row.date.format(ISO_DATE_FORMAT)).toBe('2026-10-05');
  });

  it('maps a direct debit and leaves the bank details out of the description', async () => {
    const row = await importOne(directDebit());

    expect(row.type).toBe('Direct debit');
    expect(row.date.format(ISO_DATE_FORMAT)).toBe('2026-10-05');
    expect(row.description).toBe(
      'Power Company GmbH Customer no. 123 invoice 456',
    );
  });

  it('maps the account fee to fees and charges', async () => {
    const row = await importOne(
      transaction({
        creditor: { name: 'Kontoführung' },
        transaction_amount: { currency: 'EUR', amount: '4.90' },
        remittance_information: [
          'Kontoführung\nKonto  123 EUR\nvom 01.09.2026 bis 30.09.2026',
        ],
      }),
    );

    expect(row.type).toBe('Fees and charges');
    expect(row.description).toBe('Kontoführung');
  });

  it('maps transfers by their direction and keeps their reference', async () => {
    const [outgoing, incoming] = await fetchAll([
      transaction({
        creditor: { name: 'Alex Example' },
        remittance_information: [
          'Rent share',
          'Alex Example\nEnd-to-End-Ref.:\nabc',
        ],
      }),
      transaction({
        credit_debit_indicator: 'CRDT',
        creditor: null,
        debtor: { name: 'Employer GmbH' },
        remittance_information: [
          'Salary 09/2026',
          'Employer GmbH\nKundenreferenz: XYZ',
        ],
      }),
    ]);

    expect(outgoing!.type).toBe('Outgoing transfer');
    expect(outgoing!.amount.isNegative()).toBe(true);
    expect(outgoing!.description).toBe('Alex Example Rent share');
    expect(incoming!.type).toBe('Incoming transfer');
    expect(incoming!.amount.isPositive()).toBe(true);
    expect(incoming!.description).toBe('Employer GmbH Salary 09/2026');
  });

  it('leaves out pending and zero-amount transactions', async () => {
    const rows = await fetchAll([
      transaction(),
      transaction({ status: 'PDNG', booking_date: null }),
      transaction({
        credit_debit_indicator: 'CRDT',
        creditor: null,
        debtor: { name: 'Rechnungsabschluss' },
        transaction_amount: { currency: 'EUR', amount: '0.00' },
      }),
    ]);

    expect(rows).toHaveLength(1);
  });

  it('hashes the content, so a repeated import matches and other rows differ', async () => {
    const original = await importOne(directDebit());
    const repeated = await importOne(directDebit());
    const otherDay = await importOne(
      directDebit({ booking_date: '2026-10-06' }),
    );
    const otherAmount = await importOne(
      directDebit({ transaction_amount: { currency: 'EUR', amount: '13.00' } }),
    );

    expect(repeated.hash).toBe(original.hash);
    expect(otherDay.hash).not.toBe(original.hash);
    expect(otherAmount.hash).not.toBe(original.hash);
  });

  it('gives identical rows on the same day different hashes', async () => {
    const [first, second] = await fetchAll([directDebit(), directDebit()]);
    const [alone] = await fetchAll([directDebit()]);

    expect(first!.hash).not.toBe(second!.hash);
    expect(first!.hash).toBe(alone!.hash);
  });
});
