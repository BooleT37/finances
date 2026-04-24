import { useQueries } from '@tanstack/react-query';

import { getIncomeCategoriesOrderQueryOptions } from '~/features/userSettings/facets/incomeCategoriesOrder';

import { getCategoriesQueryOptions } from '../queries';
import type { Category } from '../schema';
import { sortCategories } from './categoriesOrder';

export const useIncomeCategories = (): Category[] | undefined =>
  useQueries({
    queries: [
      getCategoriesQueryOptions(),
      getIncomeCategoriesOrderQueryOptions(),
    ],
    combine: ([categoriesResult, orderResult]) => {
      const categories = categoriesResult.data;
      const order = orderResult.data;
      if (!categories || !order) {
        return undefined;
      }
      return categories
        .filter((c) => c.isIncome)
        .sort((a, b) => sortCategories(a.id, b.id, order));
    },
  });
