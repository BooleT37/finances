import { queryOptions } from '@tanstack/react-query';

import { getProjectSettingsQueryOptions } from '../queries';

export const getSourcesOrderQueryOptions = () =>
  queryOptions({
    ...getProjectSettingsQueryOptions(),
    select: (s) => s.sourcesOrder,
  });
