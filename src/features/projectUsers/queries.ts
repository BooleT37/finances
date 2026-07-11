import { createQueryKeys } from '@lukemorales/query-key-factory';
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import {
  createProjectUser,
  deleteProjectUser,
  fetchProjectUsers,
  resetProjectUserPassword,
} from './api';
import type {
  CreateProjectUserInput,
  ResetProjectUserPasswordInput,
} from './schema';

const projectUserKeys = createQueryKeys('projectUsers', {
  all: { queryKey: null },
});

export const getProjectUsersQueryOptions = () =>
  queryOptions({
    ...projectUserKeys.all,
    staleTime: 0,
    queryFn: () => fetchProjectUsers(),
  });

export function useCreateProjectUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProjectUserInput) =>
      createProjectUser({ data: input }),
    onSuccess: () =>
      queryClient.invalidateQueries(getProjectUsersQueryOptions()),
  });
}

export function useResetProjectUserPassword() {
  return useMutation({
    mutationFn: (input: ResetProjectUserPasswordInput) =>
      resetProjectUserPassword({ data: input }),
  });
}

export function useDeleteProjectUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => deleteProjectUser({ data: userId }),
    onSuccess: () =>
      queryClient.invalidateQueries(getProjectUsersQueryOptions()),
  });
}
