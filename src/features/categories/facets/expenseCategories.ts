import { useQueries } from '@tanstack/react-query';

import { getExpenseCategoriesOrderQueryOptions } from '~/features/userSettings/facets/expenseCategoriesOrder';

import { getCategoriesQueryOptions } from '../queries';
import type { Category } from '../schema';
import { sortCategories } from './categoriesOrder';

export const useExpenseCategories = (): Category[] | undefined =>
  useQueries({
    queries: [
      getCategoriesQueryOptions(),
      getExpenseCategoriesOrderQueryOptions(),
    ],
    combine: ([categoriesResult, orderResult]) => {
      const categories = categoriesResult.data;
      const order = orderResult.data;
      if (!categories || !order) {
        return undefined;
      }
      return categories
        .filter((c) => !c.isIncome)
        .sort((a, b) => sortCategories(a.id, b.id, order));
    },
  });
