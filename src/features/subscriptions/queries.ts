import { createQueryKeys } from '@lukemorales/query-key-factory';
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import {
  createSubscription,
  deleteSubscription,
  fetchAllSubscriptions,
  updateSubscription,
} from './api';
import type {
  CreateSubscriptionInput,
  Subscription,
  UpdateSubscriptionInput,
} from './schema';
import { subscriptionSchema } from './schema';

const subscriptionKeys = createQueryKeys('subscriptions', {
  all: { queryKey: null },
});

export const getSubscriptionsQueryOptions = () =>
  queryOptions({
    ...subscriptionKeys.all,
    staleTime: 0,
    queryFn: async () => {
      const rows = await fetchAllSubscriptions();
      return rows.map((s) => subscriptionSchema.decode(s));
    },
  });

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSubscriptionInput) =>
      createSubscription({ data: input }),
    onSuccess: () =>
      queryClient.invalidateQueries(getSubscriptionsQueryOptions()),
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateSubscriptionInput) =>
      updateSubscription({ data: input }),
    onSuccess: () =>
      queryClient.invalidateQueries(getSubscriptionsQueryOptions()),
  });
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteSubscription({ data: id }),
    onMutate: async (id) => {
      const opts = getSubscriptionsQueryOptions();
      await queryClient.cancelQueries(opts);
      const previous = queryClient.getQueryData(opts.queryKey);
      queryClient.setQueryData(
        opts.queryKey,
        (old: Subscription[] | undefined) => old?.filter((s) => s.id !== id),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(
          getSubscriptionsQueryOptions().queryKey,
          context.previous,
        );
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries(getSubscriptionsQueryOptions()),
  });
}
