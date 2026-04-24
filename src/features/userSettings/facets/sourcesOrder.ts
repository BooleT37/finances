import { queryOptions } from '@tanstack/react-query';

import { getUserSettingsQueryOptions } from '../queries';

export const getSourcesOrderQueryOptions = () =>
  queryOptions({
    ...getUserSettingsQueryOptions(),
    select: (s) => s.sourcesOrder,
  });
