import { createQueryKeys } from '@lukemorales/query-key-factory';
import Decimal from 'decimal.js';

import { fetchExpensesByYear } from '~/server/functions/expenses';

export const expensesKeys = createQueryKeys('expenses', {
  byYear: (year: number) => ({
    queryKey: [year],
    queryFn: async () => {
      const expenses = await fetchExpensesByYear({ data: year });
      return expenses.map((e) => ({ ...e, cost: new Decimal(e.cost) }));
    },
  }),
});
