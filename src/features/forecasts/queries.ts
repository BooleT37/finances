import { createQueryKeys } from '@lukemorales/query-key-factory';

import { fetchForecastsByYear } from './api';
import { forecastSchema } from './schema';

export const forecastQueryKeys = createQueryKeys('forecasts', {
  byYear: (year: number) => ({
    queryKey: [year],
    queryFn: async () => {
      const rows = await fetchForecastsByYear({ data: year });
      return rows.map((f) => forecastSchema.decode(f));
    },
  }),
});
