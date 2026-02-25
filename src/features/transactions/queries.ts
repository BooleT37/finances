import { createQueryKeys } from '@lukemorales/query-key-factory';
import { queryOptions } from '@tanstack/react-query';

import { fetchTransactionsByYear } from '~/features/transactions/api';

import { transactionWithRelationsSchema } from './schema';

const transactionsKeys = createQueryKeys('transactions', {
  byYear: (year: number) => ({
    queryKey: [year],
  }),
});

export const getTransactionsQueryOptions = (year: number) => {
  return queryOptions({
    ...transactionsKeys.byYear(year),
    queryFn: async () => {
      const rows = await fetchTransactionsByYear({ data: year });
      return rows.map((t) => transactionWithRelationsSchema.decode(t));
    },
  });
};

export const getTransactionsMapByYear = (year: number) => {
  return queryOptions({
    ...getTransactionsQueryOptions(year),
    select: (data) => {
      const map = new Map<
        string,
        ReturnType<typeof transactionWithRelationsSchema.decode>
      >();
      data.forEach((t) => map.set(t.id.toString(), t));
      return map;
    },
  });
};
