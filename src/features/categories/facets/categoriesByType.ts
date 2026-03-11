import { queryOptions } from '@tanstack/react-query';

import { getCategoriesQueryOptions } from '../queries';

export const getFromSavingsCategoryQueryOptions = () =>
  queryOptions({
    ...getCategoriesQueryOptions(),
    select: (cats) => cats.find((c) => c.type === 'FROM_SAVINGS') ?? null,
  });
