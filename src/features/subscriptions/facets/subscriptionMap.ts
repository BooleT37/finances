import { queryOptions } from '@tanstack/react-query';
import { indexBy, prop } from 'ramda';

import { getSubscriptionsQueryOptions } from '../queries';

export const getSubscriptionMapQueryOptions = () =>
  queryOptions({
    ...getSubscriptionsQueryOptions(),
    select: indexBy(prop('id')),
  });
