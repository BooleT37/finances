import { queryOptions } from '@tanstack/react-query';

import { getForecastsQueryOptions } from '../queries';

export const getCategoryForecastsQueryOptions = (year: number) =>
  queryOptions({
    ...getForecastsQueryOptions(year),
    select: (forecasts) => forecasts.filter((f) => f.subcategoryId === null),
  });
