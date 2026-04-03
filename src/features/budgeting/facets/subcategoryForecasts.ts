import { queryOptions } from '@tanstack/react-query';

import { getForecastsQueryOptions } from '../queries';

export const getSubcategoryForecastsQueryOptions = (year: number) =>
  queryOptions({
    ...getForecastsQueryOptions(year),
    select: (forecasts) => forecasts.filter((f) => f.subcategoryId !== null),
  });
