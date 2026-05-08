import { createQueryKeys } from '@lukemorales/query-key-factory';
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import { getUserSettingsQueryOptions } from '~/features/userSettings/queries';

import {
  createSource,
  deleteSource,
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
import type { Source } from './schema';
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
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries(getUserSettingsQueryOptions()),
        queryClient.invalidateQueries(getSourcesQueryOptions()),
      ]),
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

export function useDeleteSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteSource({ data: id }),
    onMutate: async (id) => {
      const opts = getSourcesQueryOptions();
      await queryClient.cancelQueries(opts);
      const previous = queryClient.getQueryData(opts.queryKey);
      queryClient.setQueryData(opts.queryKey, (old: Source[] | undefined) =>
        old?.filter((s) => s.id !== id),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(
          getSourcesQueryOptions().queryKey,
          context.previous,
        );
      }
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries(getSourcesQueryOptions()),
        queryClient.invalidateQueries(getUserSettingsQueryOptions()),
      ]),
  });
}
