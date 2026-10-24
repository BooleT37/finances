import { startActiveObservation } from '@langfuse/tracing';

import type { ParsedExpense } from '~/features/transactions/parsedExpense';
import { isTracingOn } from '~/server/langfuse';

import { describeParsedExpense } from '../categoryJevQuestion';
import type {
  CategorySuggestion,
  CategorySuggestionResult,
} from '../categorySuggestion';

export interface TracedCategorySuggestion {
  traceId: string | null;
  categorySuggestion: CategorySuggestion | null;
}

export const traceCategorySuggestion = (
  parsedExpense: ParsedExpense,
  suggest: () => Promise<CategorySuggestionResult>,
) =>
  startActiveObservation(
    'suggest-category',
    async (span): Promise<TracedCategorySuggestion> => {
      span.update({ input: describeParsedExpense(parsedExpense) });
      const result = await suggest();
      span.update({ output: result });
      return {
        traceId: isTracingOn ? span.traceId : null,
        categorySuggestion: result.categorySuggestion,
      };
    },
  );
