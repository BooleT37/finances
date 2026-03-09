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

export const getFromSavingsCategoryQueryOptions = () =>
  queryOptions({
    ...getCategoriesQueryOptions(),
    select: (cats) => cats.find((c) => c.type === 'FROM_SAVINGS') ?? null,
  });
