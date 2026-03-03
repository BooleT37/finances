import { queryOptions } from '@tanstack/react-query';

import { getSavingSpendingsQueryOptions } from '../queries';
import type { SavingSpending, SavingSpendingCategory } from '../schema';

export interface SavingSpendingLookup {
  spending: SavingSpending;
  category: SavingSpendingCategory;
}

export const getSavingSpendingByCategoryIdQueryOptions = () =>
  queryOptions({
    ...getSavingSpendingsQueryOptions(),
    select: (spendings): Record<number, SavingSpendingLookup> => {
      const map: Record<number, SavingSpendingLookup> = {};
      for (const spending of spendings) {
        for (const category of spending.categories) {
          map[category.id] = { spending, category };
        }
      }
      return map;
    },
  });
