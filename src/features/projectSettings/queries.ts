import { createQueryKeys } from '@lukemorales/query-key-factory';
import { queryOptions } from '@tanstack/react-query';

import { fetchProjectSettings } from './api';
import { projectSettingsSchema } from './schema';

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
