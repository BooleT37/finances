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
      const unorderedSources = sources.filter((s) => !order.includes(s.id));
      if (unorderedSources.length > 0) {
        console.error(
          `Sources [${unorderedSources.map((s) => s.name).join(', ')}] are not included in the order setting. They will be appended at the end.`,
        );
      }
      return [...sources].sort(
        (a, b) => order.indexOf(a.id) - order.indexOf(b.id),
      );
    },
  });
