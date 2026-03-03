import { queryOptions } from '@tanstack/react-query';

import { getUserSettingsQueryOptions } from '../queries';

export const getExpenseCategoriesOrderQueryOptions = () =>
  queryOptions({
    ...getUserSettingsQueryOptions(),
    select: (s) => s.expenseCategoriesOrder,
  });
