import { createQueryKeys } from '@lukemorales/query-key-factory';
import Decimal from 'decimal.js';

import { fetchTransactionsByYear } from '~/server/functions/transactions';

export const transactionsKeys = createQueryKeys('transactions', {
  byYear: (year: number) => ({
    queryKey: [year],
    queryFn: async () => {
      const transactions = await fetchTransactionsByYear({ data: year });
      return transactions.map((t) => ({ ...t, cost: new Decimal(t.cost) }));
    },
  }),
});
