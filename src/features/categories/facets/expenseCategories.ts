import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getExpenseCategoriesOrderQueryOptions } from '~/features/userSettings/facets/expenseCategoriesOrder';

import { getCategoriesQueryOptions } from '../queries';
import { sortCategories } from './categoriesOrder';

export const useExpenseCategories = () => {
  const { data: categories } = useQuery(getCategoriesQueryOptions());
  const { data: order } = useQuery(getExpenseCategoriesOrderQueryOptions());
  return useMemo(
    () =>
      categories && order
        ? categories
            .filter((c) => !c.isIncome)
            .sort((a, b) => sortCategories(a.id, b.id, order))
        : undefined,
    [categories, order],
  );
};
