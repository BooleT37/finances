import { queryOptions } from '@tanstack/react-query';

import { getCategoriesQueryOptions } from '../queries';

export const getExpenseCategoriesQueryOptions = () =>
  queryOptions({
    ...getCategoriesQueryOptions(),
    select: (data) => data.filter((c) => !c.isIncome),
  });

export const getIncomeCategoriesQueryOptions = () =>
  queryOptions({
    ...getCategoriesQueryOptions(),
    select: (data) => data.filter((c) => c.isIncome),
  });
