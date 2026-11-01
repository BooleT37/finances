import type { Dayjs } from 'dayjs';

export function sortTransactions<T extends { date: Dayjs; id: number }>(
  transactions: T[],
): T[] {
  return transactions.toSorted((a, b) => a.date.diff(b.date) || a.id - b.id);
}
