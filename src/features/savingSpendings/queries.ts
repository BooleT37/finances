import { createQueryKeys } from '@lukemorales/query-key-factory';
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import {
  archiveSavingSpending,
  createSavingSpending,
  deleteSavingSpending,
  fetchAllSavingSpendings,
  unarchiveSavingSpending,
  updateSavingSpending,
} from './api';
import type {
  CreateSavingSpendingInput,
  UpdateSavingSpendingInput,
} from './schema';
import { savingSpendingSchema } from './schema';

const savingSpendingKeys = createQueryKeys('savingSpendings', {
  all: { queryKey: null },
});

export const getSavingSpendingsQueryOptions = () =>
  queryOptions({
    ...savingSpendingKeys.all,
    staleTime: 0,
    queryFn: async () => {
      const rows = await fetchAllSavingSpendings();
      return rows.map((s) => savingSpendingSchema.decode(s));
    },
  });

export function useCreateSavingSpending() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSavingSpendingInput) =>
      createSavingSpending({ data: input }),
    onSuccess: () =>
      queryClient.invalidateQueries(getSavingSpendingsQueryOptions()),
  });
}

export function useUpdateSavingSpending() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateSavingSpendingInput) =>
      updateSavingSpending({ data: input }),
    onSuccess: () =>
      queryClient.invalidateQueries(getSavingSpendingsQueryOptions()),
  });
}

export function useDeleteSavingSpending() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteSavingSpending({ data: id }),
    onSuccess: () =>
      queryClient.invalidateQueries(getSavingSpendingsQueryOptions()),
  });
}

export function useArchiveSavingSpending() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => archiveSavingSpending({ data: id }),
    onSuccess: () =>
      queryClient.invalidateQueries(getSavingSpendingsQueryOptions()),
  });
}

export function useUnarchiveSavingSpending() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => unarchiveSavingSpending({ data: id }),
    onSuccess: () =>
      queryClient.invalidateQueries(getSavingSpendingsQueryOptions()),
  });
}
