import dayjs from 'dayjs';
import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';

import { isSameTransaction } from './isSameTransaction';

const bankRow = (date: string, amount = '-1541.43') => ({
  date: dayjs(date),
  type: 'Direct debit',
  description: 'Rent',
  amount: new Decimal(amount),
  hash: 'bank-hash',
});

const manuallyEntered = (date: string, cost = '-1541.43') => ({
  date: dayjs(date),
  cost: new Decimal(cost),
  importHash: null,
});

const imported = (date: string, cost = '-1541.43') => ({
  date: dayjs(date),
  cost: new Decimal(cost),
  importHash: 'other-hash',
});

describe('isSameTransaction', () => {
  it('matches a transaction with the same hash, whatever its date and amount', () => {
    expect(
      isSameTransaction(bankRow('2026-10-01'), {
        ...imported('2026-08-20', '-5'),
        importHash: 'bank-hash',
      }),
    ).toBe(true);
  });

  it('matches any transaction with the same amount on the same day', () => {
    expect(
      isSameTransaction(bankRow('2026-10-01'), imported('2026-10-01')),
    ).toBe(true);
  });

  it('ignores the sign of the amount', () => {
    expect(
      isSameTransaction(
        bankRow('2026-10-01'),
        manuallyEntered('2026-10-02', '1541.43'),
      ),
    ).toBe(true);
  });

  it('matches a manually entered transaction a day away', () => {
    expect(
      isSameTransaction(bankRow('2026-10-01'), manuallyEntered('2026-10-02')),
    ).toBe(true);
  });

  it.each(['2026-10-05', '2026-10-15'])(
    'matches a manually entered transaction exactly 5 days away (%s)',
    (date) => {
      expect(
        isSameTransaction(bankRow('2026-10-10'), manuallyEntered(date)),
      ).toBe(true);
    },
  );

  it.each(['2026-10-04', '2026-10-16'])(
    'skips a manually entered transaction 6 days away (%s)',
    (date) => {
      expect(
        isSameTransaction(bankRow('2026-10-10'), manuallyEntered(date)),
      ).toBe(false);
    },
  );

  it('skips a manually entered transaction in another month', () => {
    expect(
      isSameTransaction(bankRow('2026-10-31'), manuallyEntered('2026-11-02')),
    ).toBe(false);
  });

  it('skips a manually entered transaction with a different amount', () => {
    expect(
      isSameTransaction(
        bankRow('2026-10-01'),
        manuallyEntered('2026-10-02', '-1541.44'),
      ),
    ).toBe(false);
  });

  it('skips an imported transaction on another day', () => {
    expect(
      isSameTransaction(bankRow('2026-10-01'), imported('2026-10-02')),
    ).toBe(false);
  });
});
