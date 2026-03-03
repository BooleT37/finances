import { queryOptions } from '@tanstack/react-query';

import { getUserSettingsQueryOptions } from '../queries';

export const getIncomeCategoriesOrderQueryOptions = () =>
  queryOptions({
    ...getUserSettingsQueryOptions(),
    select: (s) => s.incomeCategoriesOrder,
  });
