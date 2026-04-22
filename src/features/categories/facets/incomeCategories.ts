import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getIncomeCategoriesOrderQueryOptions } from '~/features/userSettings/facets/incomeCategoriesOrder';

import { getCategoriesQueryOptions } from '../queries';
import { sortCategories } from './categoriesOrder';

export const useIncomeCategories = () => {
  const { data: categories } = useQuery(getCategoriesQueryOptions());
  const { data: order } = useQuery(getIncomeCategoriesOrderQueryOptions());
  return useMemo(
    () =>
      categories && order
        ? categories
            .filter((c) => c.isIncome)
            .sort((a, b) => sortCategories(a.id, b.id, order))
        : undefined,
    [categories, order],
  );
};
