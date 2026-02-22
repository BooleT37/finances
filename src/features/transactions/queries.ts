import { createQueryKeys } from '@lukemorales/query-key-factory';

import { fetchTransactionsByYear } from '~/features/transactions/api';

import { transactionWithRelationsSchema } from './schema';

export const transactionsKeys = createQueryKeys('transactions', {
  byYear: (year: number) => ({
    queryKey: [year],
    queryFn: async () => {
      const rows = await fetchTransactionsByYear({ data: year });
      return rows.map((t) => transactionWithRelationsSchema.decode(t));
    },
  }),
});
