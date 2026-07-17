import { createQueryKeys } from '@lukemorales/query-key-factory';
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import { fetchProject, renameProject } from './api';
import type { RenameProjectInput } from './schema';

const projectKeys = createQueryKeys('project', {
  info: { queryKey: null },
});

export const getProjectQueryOptions = () =>
  queryOptions({
    ...projectKeys.info,
    queryFn: () => fetchProject(),
  });

export function useRenameProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RenameProjectInput) => renameProject({ data: input }),
    onSuccess: () => queryClient.invalidateQueries(getProjectQueryOptions()),
  });
}
