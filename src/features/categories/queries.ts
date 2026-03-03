import { createQueryKeys } from '@lukemorales/query-key-factory';
import { queryOptions } from '@tanstack/react-query';

import { fetchAllCategories } from './api';
import { categorySchema } from './schema';

// ── Categories ───────────────────────────────────────────────────────────────

const categoryKeys = createQueryKeys('categories', {
  all: { queryKey: null },
});

export const getCategoriesQueryOptions = () =>
  queryOptions({
    ...categoryKeys.all,
    staleTime: Infinity, // Reference data — rarely changes within a session
    queryFn: async () => {
      const rows = await fetchAllCategories();
      return rows.map((c) => categorySchema.decode(c));
    },
  });
