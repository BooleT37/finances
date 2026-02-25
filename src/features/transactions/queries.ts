import { createQueryKeys } from '@lukemorales/query-key-factory';
import { queryOptions } from '@tanstack/react-query';
import { indexBy, prop } from 'ramda';

import { fetchTransactionsByYear } from '~/features/transactions/api';

import { transactionWithComponentsSchema } from './schema';

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
      return rows.map((t) => transactionWithComponentsSchema.decode(t));
    },
  });
};

export const getTransactionsMapByYear = (year: number) => {
  return queryOptions({
    ...getTransactionsQueryOptions(year),
    select: indexBy(prop('id')),
  });
};
