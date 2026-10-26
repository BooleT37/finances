import { startActiveObservation } from '@langfuse/tracing';

import type { ImportedTransaction } from '~/features/transactions/importedTransaction';
import { isTracingOn } from '~/server/langfuse';

import { describeImportedTransaction } from '../categoryJevQuestion';
import type {
  CategorySuggestion,
  CategorySuggestionResult,
} from '../categorySuggestion';

export interface TracedCategorySuggestion {
  traceId: string | null;
  categorySuggestion: CategorySuggestion | null;
}

export const traceCategorySuggestion = (
  importedTransaction: ImportedTransaction,
  suggest: () => Promise<CategorySuggestionResult>,
) =>
  startActiveObservation(
    'suggest-category',
    async (span): Promise<TracedCategorySuggestion> => {
      span.update({ input: describeImportedTransaction(importedTransaction) });
      const result = await suggest();
      span.update({ output: result });
      return {
        traceId: isTracingOn ? span.traceId : null,
        categorySuggestion: result.categorySuggestion,
      };
    },
  );
