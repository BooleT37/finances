import { useQueries } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';

import { getTransactionsQueryOptions } from '~/features/transactions/queries';
import { getToday } from '~/shared/utils/today';

/** `undefined` while loading, `null` when the source has no imported transactions in those years. */
export function useLastImportedTransactionDate(
  sourceId: number,
): Dayjs | null | undefined {
  const today = getToday();
  const years = new Set([today.year(), today.subtract(1, 'month').year()]);

  return useQueries({
    queries: [...years].map((year) => getTransactionsQueryOptions(year)),
    combine: (results) => {
      if (results.some((result) => result.isPending)) {
        return undefined;
      }
      return dayjs.max(
        results
          .flatMap((result) => result.data ?? [])
          .filter((tx) => tx.sourceId === sourceId && tx.importHash != null)
          .map((tx) => tx.date),
      );
    },
  });
}
