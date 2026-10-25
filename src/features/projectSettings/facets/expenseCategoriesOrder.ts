import { queryOptions } from '@tanstack/react-query';

import { getProjectSettingsQueryOptions } from '../queries';

export const getExpenseCategoriesOrderQueryOptions = () =>
  queryOptions({
    ...getProjectSettingsQueryOptions(),
    select: (s) => s.expenseCategoriesOrder,
  });
