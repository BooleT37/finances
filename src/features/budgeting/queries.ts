import { createQueryKeys } from '@lukemorales/query-key-factory';
import {
  mutationOptions,
  type QueryClient,
  queryOptions,
} from '@tanstack/react-query';

import {
  fetchForecastsByYear,
  upsertCategoryForecast,
  type UpsertCategoryForecastInput,
  upsertSubcategoryForecasts,
  type UpsertSubcategoryForecastsInput,
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

export const getUpsertCategoryForecastMutationOptions = (
  queryClient: QueryClient,
  year: number,
) =>
  mutationOptions({
    mutationFn: (input: UpsertCategoryForecastInput) =>
      upsertCategoryForecast({ data: input }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: getForecastsQueryOptions(year).queryKey,
      }),
  });

export const getUpsertSubcategoryForecastsMutationOptions = (
  queryClient: QueryClient,
  year: number,
) =>
  mutationOptions({
    mutationFn: (input: UpsertSubcategoryForecastsInput) =>
      upsertSubcategoryForecasts({ data: input }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: getForecastsQueryOptions(year).queryKey,
      }),
  });
