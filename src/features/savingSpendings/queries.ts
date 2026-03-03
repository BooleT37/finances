import { createQueryKeys } from '@lukemorales/query-key-factory';
import { queryOptions } from '@tanstack/react-query';

import { fetchAllSavingSpendings } from './api';
import { savingSpendingSchema } from './schema';

const savingSpendingKeys = createQueryKeys('savingSpendings', {
  all: { queryKey: null },
});

export const getSavingSpendingsQueryOptions = () =>
  queryOptions({
    ...savingSpendingKeys.all,
    staleTime: Infinity,
    queryFn: async () => {
      const rows = await fetchAllSavingSpendings();
      return rows.map((s) => savingSpendingSchema.decode(s));
    },
  });
