import { createQueryKeys } from '@lukemorales/query-key-factory';
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import { getUserSettingsQueryOptions } from '~/features/userSettings/queries';

import {
  createCategory,
  deleteCategory,
  fetchAllCategories,
  updateCategory,
  updateCategoryOrder,
} from './api';
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
  UpdateCategoryOrderInput,
} from './schema';
import { categorySchema } from './schema';

// ── Categories ───────────────────────────────────────────────────────────────

const categoryKeys = createQueryKeys('categories', {
  all: { queryKey: null },
});

export const getCategoriesQueryOptions = () =>
  queryOptions({
    ...categoryKeys.all,
    staleTime: 0,
    queryFn: async () => {
      const rows = await fetchAllCategories();
      return rows.map((c) => categorySchema.decode(c));
    },
  });

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCategoryInput) => createCategory({ data: input }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries(getUserSettingsQueryOptions()),
        queryClient.invalidateQueries(getCategoriesQueryOptions()),
      ]),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCategoryInput) => updateCategory({ data: input }),
    onSuccess: () => queryClient.invalidateQueries(getCategoriesQueryOptions()),
  });
}

export function useUpdateCategoryOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCategoryOrderInput) =>
      updateCategoryOrder({ data: input }),
    onSettled: () =>
      queryClient.invalidateQueries(getUserSettingsQueryOptions()),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCategory({ data: id }),
    onMutate: async (id) => {
      const opts = getCategoriesQueryOptions();
      await queryClient.cancelQueries(opts);
      const previous = queryClient.getQueryData(opts.queryKey);
      queryClient.setQueryData(opts.queryKey, (old: Category[] | undefined) =>
        old?.filter((c) => c.id !== id),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(
          getCategoriesQueryOptions().queryKey,
          context.previous,
        );
      }
    },
    onSettled: () => queryClient.invalidateQueries(getCategoriesQueryOptions()),
  });
}
