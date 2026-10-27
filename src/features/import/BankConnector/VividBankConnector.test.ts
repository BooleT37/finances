import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import { ISO_DATE_FORMAT } from '~/shared/constants';

import type {
  EnableBankingAccount,
  EnableBankingClient,
  EnableBankingTransaction,
} from './EnableBankingClient';
import { VividBankConnector } from './VividBankConnector';

const OWN_NAME = 'Alex Example';

function transaction(
  overrides: Partial<EnableBankingTransaction> = {},
): EnableBankingTransaction {
  return {
    entry_reference: 'i_00000000-0000-4000-8000-000000000001',
    transaction_amount: { currency: 'EUR', amount: '12.50' },
    credit_debit_indicator: 'DBIT',
    status: 'BOOK',
    booking_date: '2026-10-02',
    creditor: { name: 'REWE Markt' },
    debtor: { name: OWN_NAME },
    remittance_information: [],
    bank_transaction_code: {
      description: 'PMNT',
      code: 'CCRD',
      sub_code: 'POSD',
    },
    ...overrides,
  };
}

const connectorReturning = (transactions: EnableBankingTransaction[]) =>
  new VividBankConnector({
    fetchTransactions: async () => transactions,
  } as unknown as EnableBankingClient);

const importOne = async (tx: EnableBankingTransaction) => {
  const [row] = await connectorReturning([tx]).fetchTransactions({
    accountUid: 'account',
    dateFrom: dayjs('2026-10-01'),
  });
  return row!;
};

describe('VividBankConnector.fetchTransactions', () => {
  it('maps a card payment to a negative card transaction named after the merchant', async () => {
    const row = await importOne(transaction());

    expect(row.type).toBe('Card transaction');
    expect(row.amount.toString()).toBe('-12.5');
    expect(row.description).toBe('REWE Markt');
    expect(row.date.format(ISO_DATE_FORMAT)).toBe('2026-10-02');
  });

  it('maps an incoming SEPA transfer to a positive incoming transfer with its reference', async () => {
    const row = await importOne(
      transaction({
        credit_debit_indicator: 'CRDT',
        creditor: { name: OWN_NAME },
        debtor: { name: 'Employer GmbH' },
        remittance_information: ['Salary October'],
        bank_transaction_code: {
          description: 'PMNT',
          code: 'RRCT',
          sub_code: 'ESCT',
        },
      }),
    );

    expect(row.type).toBe('Incoming transfer');
    expect(row.amount.toString()).toBe('12.5');
    expect(row.description).toBe('Employer GmbH Salary October');
  });

  it('maps an outgoing SEPA transfer to an outgoing transfer', async () => {
    const row = await importOne(
      transaction({
        creditor: { name: 'Landlord' },
        bank_transaction_code: {
          description: 'PMNT',
          code: 'IRCT',
          sub_code: 'ESCT',
        },
      }),
    );

    expect(row.type).toBe('Outgoing transfer');
    expect(row.amount.isNegative()).toBe(true);
  });

  it('maps a transfer between own accounts in both directions', async () => {
    const [out, back] = await connectorReturning([
      transaction({
        entry_reference: 'i_out',
        creditor: { name: OWN_NAME },
        bank_transaction_code: {
          description: 'PMNT',
          code: 'IRCT',
          sub_code: 'BOOK',
        },
      }),
      transaction({
        entry_reference: 'i_back',
        credit_debit_indicator: 'CRDT',
        creditor: { name: OWN_NAME },
        debtor: { name: OWN_NAME },
        bank_transaction_code: {
          description: 'PMNT',
          code: 'RRCT',
          sub_code: 'BOOK',
        },
      }),
    ]).fetchTransactions({ accountUid: 'account', dateFrom: dayjs() });

    expect(out!.type).toBe('Transfer between own accounts');
    expect(out!.amount.isNegative()).toBe(true);
    expect(back!.type).toBe('Transfer between own accounts');
    expect(back!.amount.isPositive()).toBe(true);
  });

  it('maps an internal transfer to another person to an outgoing transfer', async () => {
    const row = await importOne(
      transaction({
        creditor: { name: 'Another Customer' },
        bank_transaction_code: {
          description: 'PMNT',
          code: 'IRCT',
          sub_code: 'BOOK',
        },
      }),
    );

    expect(row.type).toBe('Outgoing transfer');
  });

  it('maps a fee to fees and charges', async () => {
    const row = await importOne(
      transaction({
        creditor: { name: 'Vivid Money' },
        bank_transaction_code: {
          description: 'ACMT',
          code: 'MDOP',
          sub_code: 'FEES',
        },
      }),
    );

    expect(row.type).toBe('Fees and charges');
  });

  it('shows an unknown transaction code as it is', async () => {
    const row = await importOne(
      transaction({
        bank_transaction_code: {
          description: 'PMNT',
          code: 'RDDT',
          sub_code: 'ESDD',
        },
      }),
    );

    expect(row.type).toBe('PMNT/RDDT/ESDD');
  });

  it('leaves out transactions that are not booked yet', async () => {
    const rows = await connectorReturning([
      transaction({ entry_reference: 'booked' }),
      transaction({ entry_reference: 'pending', status: 'PDNG' }),
    ]).fetchTransactions({ accountUid: 'account', dateFrom: dayjs() });

    expect(rows).toHaveLength(1);
  });

  it('hashes only the bank reference, so a repeated import matches', async () => {
    const original = await importOne(transaction());
    const edited = await importOne(
      transaction({
        transaction_amount: { currency: 'EUR', amount: '99.00' },
        creditor: { name: 'Renamed merchant' },
      }),
    );
    const other = await importOne(
      transaction({
        entry_reference: 'i_00000000-0000-4000-8000-000000000002',
      }),
    );

    expect(edited.hash).toBe(original.hash);
    expect(other.hash).not.toBe(original.hash);
  });

  it('refuses a booked transaction without a bank reference', async () => {
    await expect(
      importOne(transaction({ entry_reference: null })),
    ).rejects.toThrow();
  });
});

describe('VividBankConnector.completeAuth', () => {
  it('labels the accounts and takes the expiry from the session', async () => {
    const accounts: EnableBankingAccount[] = [
      {
        uid: 'with-iban',
        currency: 'EUR',
        product: 'Main account',
        account_id: { iban: 'DE00 0000 0000 0000 0000 00' },
      },
      { uid: 'name-only', currency: 'EUR', name: 'Pocket' },
      { uid: 'bare', currency: 'USD' },
    ];
    const connector = new VividBankConnector({
      createSession: async () => ({
        session_id: 'session',
        accounts,
        access: { valid_until: '2027-04-25T10:00:00Z' },
      }),
    } as unknown as EnableBankingClient);

    const session = await connector.completeAuth('code');

    expect(session.sessionId).toBe('session');
    expect(session.accounts).toEqual([
      {
        uid: 'with-iban',
        currency: 'EUR',
        label: 'Main account · DE00 0000 0000 0000 0000 00',
      },
      { uid: 'name-only', currency: 'EUR', label: 'Pocket' },
      { uid: 'bare', currency: 'USD', label: 'bare' },
    ]);
    expect(session.expiresAt.toISOString()).toBe('2027-04-25T10:00:00.000Z');
  });
});
