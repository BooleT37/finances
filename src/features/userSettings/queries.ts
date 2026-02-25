import { createQueryKeys } from '@lukemorales/query-key-factory';
import { queryOptions } from '@tanstack/react-query';

import { fetchUserSettings } from './api';
import { userSettingSchema } from './schema';

const userSettingsKeys = createQueryKeys('userSettings', {
  all: { queryKey: null },
});

export const getUserSettingsQueryOptions = () =>
  queryOptions({
    ...userSettingsKeys.all,
    queryFn: async () => {
      const data = await fetchUserSettings();
      return userSettingSchema.decode(data);
    },
  });
