import { createQueryKeys } from '@lukemorales/query-key-factory';

import { fetchUserSettings } from './api';
import { userSettingSchema } from './schema';

export const userSettingsKeys = createQueryKeys('userSettings', {
  all: {
    queryKey: null,
    queryFn: async () => {
      const data = await fetchUserSettings();
      return userSettingSchema.decode(data);
    },
  },
});
