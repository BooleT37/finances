import { createQueryKeys } from '@lukemorales/query-key-factory';
import { queryOptions } from '@tanstack/react-query';

import { fetchAllSubscriptions } from './api';
import { subscriptionSchema } from './schema';

const subscriptionKeys = createQueryKeys('subscriptions', {
  all: { queryKey: null },
});

export const getSubscriptionsQueryOptions = () =>
  queryOptions({
    ...subscriptionKeys.all,
    staleTime: Infinity, // Reference data — rarely changes within a session
    queryFn: async () => {
      const rows = await fetchAllSubscriptions();
      return rows.map((s) => subscriptionSchema.decode(s));
    },
  });
