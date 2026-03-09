import { queryOptions } from '@tanstack/react-query';
import { indexBy, prop } from 'ramda';

import { getSavingSpendingsQueryOptions } from '../queries';

export const getSavingSpendingMapQueryOptions = () =>
  queryOptions({
    ...getSavingSpendingsQueryOptions(),
    select: indexBy(prop('id')),
  });
