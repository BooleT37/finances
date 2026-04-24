import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getSourcesOrderQueryOptions } from '~/features/userSettings/facets/sourcesOrder';

import { getSourcesQueryOptions } from '../queries';

export const useOrderedSources = () => {
  const { data: sources } = useQuery(getSourcesQueryOptions());
  const { data: order } = useQuery(getSourcesOrderQueryOptions());
  return useMemo(
    () =>
      sources && order
        ? [...sources].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
        : undefined,
    [sources, order],
  );
};
