import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

import { getTransactionsQueryOptions } from '../queries';
import type { Transaction } from '../schema';

export function useLastTransactionsPerSource(
  year: number,
): Record<number, Transaction[]> | undefined {
  const { data: currentYear } = useQuery(getTransactionsQueryOptions(year));
  const { data: prevYear } = useQuery(getTransactionsQueryOptions(year - 1));

  if (currentYear === undefined || prevYear === undefined) {
    return undefined;
  }

  const bySource = new Map<number, Transaction[]>();
  for (const tx of [...currentYear, ...prevYear]) {
    if (tx.sourceId === null) {
      continue;
    }
    const list = bySource.get(tx.sourceId) ?? [];
    list.push(tx);
    bySource.set(tx.sourceId, list);
  }

  const result: Record<number, Transaction[]> = {};
  for (const [sourceId, txs] of bySource) {
    const effectiveDates = txs.map((tx) => tx.actualDate ?? tx.date);
    const lastDate = dayjs.max(effectiveDates);
    if (!lastDate) {
      continue;
    }
    result[sourceId] = txs.filter((tx) =>
      (tx.actualDate ?? tx.date).isSame(lastDate, 'day'),
    );
  }
  return result;
}
