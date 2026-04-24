import { useQueries } from '@tanstack/react-query';

import { getSourcesOrderQueryOptions } from '~/features/userSettings/facets/sourcesOrder';

import { getSourcesQueryOptions } from '../queries';
import type { Source } from '../schema';

export const useOrderedSources = (): Source[] | undefined =>
  useQueries({
    queries: [getSourcesQueryOptions(), getSourcesOrderQueryOptions()],
    combine: ([sourcesResult, orderResult]) => {
      const sources = sourcesResult.data;
      const order = orderResult.data;
      if (!sources || !order) {
        return undefined;
      }
      return [...sources].sort(
        (a, b) => order.indexOf(a.id) - order.indexOf(b.id),
      );
    },
  });
