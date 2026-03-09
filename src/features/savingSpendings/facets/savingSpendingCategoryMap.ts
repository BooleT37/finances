import { queryOptions } from '@tanstack/react-query';
import { indexBy, prop } from 'ramda';

import { getSavingSpendingsQueryOptions } from '../queries';

export const getSavingSpendingCategoryMapQueryOptions = () =>
  queryOptions({
    ...getSavingSpendingsQueryOptions(),
    select: (spendings) =>
      indexBy(
        prop('id'),
        spendings.flatMap((s) => s.categories),
      ),
  });
