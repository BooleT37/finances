import { createQueryKeys } from '@lukemorales/query-key-factory';
import { queryOptions } from '@tanstack/react-query';

import { fetchAllSources } from './api';
import { sourceSchema } from './schema';

const sourceKeys = createQueryKeys('sources', {
  all: { queryKey: null },
});

export const getSourcesQueryOptions = () =>
  queryOptions({
    ...sourceKeys.all,
    staleTime: Infinity, // Reference data — rarely changes within a session
    queryFn: async () => {
      const rows = await fetchAllSources();
      return rows.map((s) => sourceSchema.decode(s));
    },
  });
