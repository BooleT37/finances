import { queryOptions } from '@tanstack/react-query';
import { indexBy, prop } from 'ramda';

import { getSourcesQueryOptions } from '../queries';

export const getSourceMapQueryOptions = () =>
  queryOptions({
    ...getSourcesQueryOptions(),
    select: indexBy(prop('id')),
  });
