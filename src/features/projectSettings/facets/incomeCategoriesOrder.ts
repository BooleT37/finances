import { queryOptions } from '@tanstack/react-query';

import { getProjectSettingsQueryOptions } from '../queries';

export const getIncomeCategoriesOrderQueryOptions = () =>
  queryOptions({
    ...getProjectSettingsQueryOptions(),
    select: (s) => s.incomeCategoriesOrder,
  });
