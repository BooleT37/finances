import { createQueryKeys } from '@lukemorales/query-key-factory';
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import { getUserSettingsQueryOptions } from '~/features/userSettings/queries';

import {
  createSource,
  fetchAllSources,
  updateSourceName,
  updateSourceOrder,
  updateSourceParser,
} from './api';
import type {
  CreateSourceInput,
  UpdateSourceNameInput,
  UpdateSourceOrderInput,
  UpdateSourceParserInput,
} from './schema';
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

export function useCreateSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSourceInput) => createSource({ data: input }),
    onSuccess: () => queryClient.invalidateQueries(getSourcesQueryOptions()),
  });
}

export function useUpdateSourceName() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateSourceNameInput) =>
      updateSourceName({ data: input }),
    onSuccess: () => queryClient.invalidateQueries(getSourcesQueryOptions()),
  });
}

export function useUpdateSourceParser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateSourceParserInput) =>
      updateSourceParser({ data: input }),
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
