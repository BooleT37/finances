import { queryOptions } from '@tanstack/react-query';
import { indexBy, prop } from 'ramda';

import { getTransactionsQueryOptions } from '../queries';

export const getTransactionsMapByYear = (year: number) =>
  queryOptions({
    ...getTransactionsQueryOptions(year),
    select: indexBy(prop('id')),
  });
