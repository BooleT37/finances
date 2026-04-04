import { createQueryKeys } from '@lukemorales/query-key-factory';
import {
  mutationOptions,
  type QueryClient,
  queryOptions,
} from '@tanstack/react-query';

import {
  fetchForecastsByYear,
  upsertForecast,
  type UpsertForecastInput,
} from './api';
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

export const getUpsertForecastMutationOptions = (
  queryClient: QueryClient,
  year: number,
) =>
  mutationOptions({
    mutationFn: async (input: UpsertForecastInput) => {
      const wire = await upsertForecast({ data: input });
      return forecastSchema.decode(wire);
    },
    onSuccess: (upserted) => {
      queryClient.setQueryData(
        getForecastsQueryOptions(year).queryKey,
        (old) => {
          if (!old) {
            return [upserted];
          }
          const idx = old.findIndex(
            (f) =>
              f.categoryId === upserted.categoryId &&
              f.subcategoryId === upserted.subcategoryId &&
              f.month === upserted.month &&
              f.year === upserted.year,
          );
          if (idx === -1) {
            return [...old, upserted];
          }
          const next = [...old];
          next[idx] = upserted;
          return next;
        },
      );
    },
  });
