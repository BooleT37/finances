import { createQueryKeys } from '@lukemorales/query-key-factory';
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import { getUserSettingsQueryOptions } from '~/features/userSettings/queries';

import { fetchAllSources, updateSourceName, updateSourceOrder } from './api';
import type { UpdateSourceNameInput, UpdateSourceOrderInput } from './schema';
import { sourceSchema } from './schema';

const sourceKeys = createQueryKeys('sources', {
  all: { queryKey: null },
});

export const getSourcesQueryOptions = () =>
  queryOptions({
    ...sourceKeys.all,
    staleTime: 0,
    queryFn: async () => {
      const rows = await fetchAllSources();
      return rows.map((s) => sourceSchema.decode(s));
    },
  });

export function useUpdateSourceName() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateSourceNameInput) =>
      updateSourceName({ data: input }),
    onSuccess: () => queryClient.invalidateQueries(getSourcesQueryOptions()),
  });
}

export function useUpdateSourceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateSourceOrderInput) =>
      updateSourceOrder({ data: input }),
    onSettled: () =>
      queryClient.invalidateQueries(getUserSettingsQueryOptions()),
  });
}
