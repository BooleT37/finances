import { createQueryKeys } from '@lukemorales/query-key-factory';
import { queryOptions } from '@tanstack/react-query';

import { fetchComparisonData, fetchDynamicsData } from './api';
import {
  comparisonCategoryDataSchema,
  dynamicsMonthDataSchema,
  type FetchComparisonDataInput,
  type FetchDynamicsDataInput,
} from './schema';

const statisticsKeys = createQueryKeys('statistics', {
  comparison: (input: FetchComparisonDataInput) => ({ queryKey: [input] }),
  dynamics: (input: FetchDynamicsDataInput) => ({ queryKey: [input] }),
});

export const getComparisonDataQueryOptions = (
  input: FetchComparisonDataInput,
) =>
  queryOptions({
    ...statisticsKeys.comparison(input),
    staleTime: 0,
    queryFn: async () => {
      const rows = await fetchComparisonData({ data: input });
      return rows.map((row) => comparisonCategoryDataSchema.decode(row));
    },
  });

export const getDynamicsDataQueryOptions = (input: FetchDynamicsDataInput) =>
  queryOptions({
    ...statisticsKeys.dynamics(input),
    staleTime: 0,
    queryFn: async () => {
      const rows = await fetchDynamicsData({ data: input });
      return rows.map((row) => dynamicsMonthDataSchema.decode(row));
    },
  });
