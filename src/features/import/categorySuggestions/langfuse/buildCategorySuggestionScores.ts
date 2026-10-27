import type { LangfuseClient } from '@langfuse/client';

type Score = Parameters<LangfuseClient['score']['create']>[0];

export interface ImportedCategorySuggestion {
  traceId: string;
  suggestedValue: string | null;
  importedValue: string;
  importedCategory: string;
}

/**
 * `category_chosen` for every imported row with a trace, and
 * `suggestion_accepted` for the rows that had a category suggestion. Score ids
 * are derived from the trace, so sending a score again replaces it.
 */
export const buildCategorySuggestionScores = (
  importedSuggestions: ImportedCategorySuggestion[],
): Score[] =>
  importedSuggestions.flatMap(
    ({ traceId, suggestedValue, importedValue, importedCategory }) => [
      {
        id: `${traceId}-category_chosen`,
        traceId,
        name: 'category_chosen',
        dataType: 'CATEGORICAL',
        value: importedCategory,
      },
      ...(suggestedValue === null
        ? []
        : [
            {
              id: `${traceId}-suggestion_accepted`,
              traceId,
              name: 'suggestion_accepted',
              dataType: 'BOOLEAN' as const,
              value: suggestedValue === importedValue ? 1 : 0,
            },
          ]),
    ],
  );
