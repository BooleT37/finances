import { propagateAttributes } from '@langfuse/tracing';

import { flushLangfuse } from '~/server/langfuse';
import { JEV_MODEL } from '~/server/typesafe';

import {
  CATEGORY_SUGGESTION_MIN_CONFIDENCE,
  SIMILAR_TRANSACTIONS_LIMIT,
} from '../categorySuggestion';

/**
 * Groups the traces of one import's category suggestions into a Langfuse
 * session, and sends them before returning, even when suggesting fails.
 */
export async function traceCategorySuggestions<T>(
  { userId, sourceId }: { userId: string; sourceId: number },
  suggest: () => Promise<T>,
): Promise<T> {
  try {
    return await propagateAttributes(
      {
        userId,
        sessionId: crypto.randomUUID(),
        traceName: 'suggest-category',
        metadata: {
          sourceId,
          model: JEV_MODEL,
          minConfidence: CATEGORY_SUGGESTION_MIN_CONFIDENCE,
          similarTransactionsLimit: SIMILAR_TRANSACTIONS_LIMIT,
        },
      },
      suggest,
    );
  } finally {
    await flushLangfuse();
  }
}
