import { queryOptions } from '@tanstack/react-query';
import { indexBy, prop } from 'ramda';

import { getCategoriesQueryOptions } from '../queries';

export const getCategoryMapQueryOptions = () =>
  queryOptions({
    ...getCategoriesQueryOptions(),
    select: indexBy(prop('id')),
  });
