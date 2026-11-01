import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import { sortTransactions } from './sortTransactions';

const tx = (id: number, date: string) => ({ id, date: dayjs(date) });
const ids = (transactions: { id: number }[]) =>
  transactions.map(({ id }) => id);

describe('sortTransactions', () => {
  it('orders transactions by date', () => {
    const sorted = sortTransactions([
      tx(1, '2026-03-10'),
      tx(2, '2026-01-05'),
      tx(3, '2026-02-20'),
    ]);

    expect(ids(sorted)).toEqual([2, 3, 1]);
  });

  it('orders transactions on the same date by id', () => {
    const sorted = sortTransactions([
      tx(3, '2026-03-10'),
      tx(1, '2026-03-10'),
      tx(2, '2026-03-10'),
    ]);

    expect(ids(sorted)).toEqual([1, 2, 3]);
  });

  it('does not change the original array', () => {
    const transactions = [tx(2, '2026-03-10'), tx(1, '2026-03-10')];

    sortTransactions(transactions);

    expect(ids(transactions)).toEqual([2, 1]);
  });
});
