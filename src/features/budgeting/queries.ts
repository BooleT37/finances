import { createQueryKeys } from '@lukemorales/query-key-factory';
import { queryOptions } from '@tanstack/react-query';

import { fetchForecastsByYear } from './api';
import { forecastSchema } from './schema';

const forecastKeys = createQueryKeys('forecasts', {
  byYear: (year: number) => ({ queryKey: [year] }),
});

export const getForecastsQueryOptions = (year: number) =>
  queryOptions({
    ...forecastKeys.byYear(year),
    queryFn: async () => {
      const rows = await fetchForecastsByYear({ data: year });
      return rows.map((f) => forecastSchema.decode(f));
    },
  });
