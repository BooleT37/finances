import { createQueryKeys } from '@lukemorales/query-key-factory';
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import { fetchProjectSettings, setCategorySuggestionsEnabled } from './api';
import {
  projectSettingsSchema,
  type SetCategorySuggestionsEnabledInput,
} from './schema';

const projectSettingsKeys = createQueryKeys('projectSettings', {
  all: { queryKey: null },
});

export const getProjectSettingsQueryOptions = () =>
  queryOptions({
    ...projectSettingsKeys.all,
    queryFn: async () => {
      const data = await fetchProjectSettings();
      return projectSettingsSchema.decode(data);
    },
  });

export function useSetCategorySuggestionsEnabled() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SetCategorySuggestionsEnabledInput) =>
      setCategorySuggestionsEnabled({ data: input }),
    onSuccess: () =>
      queryClient.invalidateQueries(getProjectSettingsQueryOptions()),
  });
}
