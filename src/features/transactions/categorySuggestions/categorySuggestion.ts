import type { ParsedExpenseCategoryValue } from '~/features/transactions/parsedExpenseCategoryValue';
import type { Subscription } from '~/generated/prisma/client';
import type { JevChoiceAnswer } from '~/server/typesafe';

import {
  type CategoryJevCriterion,
  resolveCategoryJevCriterion,
} from './categoryJevCriteria';
import {
  type CategoryJevChoice,
  UNKNOWN_JEV_CHOICE,
} from './categoryJevQuestion';

export const SIMILAR_TRANSACTIONS_LIMIT = 10;
export const CATEGORY_SUGGESTION_MIN_CONFIDENCE = 0.8;
export const CATEGORY_SUGGESTION_CONCURRENCY = 4;

export interface CategorySuggestion {
  value: ParsedExpenseCategoryValue;
  confidence: number;
  similarCount: number;
}

export type CategorySuggestionResult =
  | { outcome: 'suggested'; categorySuggestion: CategorySuggestion }
  | {
      outcome: 'unknown' | 'low-confidence' | 'unresolved';
      categorySuggestion: null;
    };

/**
 * Turns Jev's choice into a category suggestion, or says why there is none:
 * Jev chose `unknown`, isn't confident enough, or chose something that no
 * longer resolves to one of the criteria.
 */
export function toCategorySuggestion({
  answer,
  criteria,
  subscriptions,
  similarCount,
}: {
  answer: JevChoiceAnswer<CategoryJevChoice>;
  criteria: CategoryJevCriterion[];
  subscriptions: Subscription[];
  similarCount: number;
}): CategorySuggestionResult {
  if (answer.choice === UNKNOWN_JEV_CHOICE) {
    return { outcome: 'unknown', categorySuggestion: null };
  }
  if (answer.confidence < CATEGORY_SUGGESTION_MIN_CONFIDENCE) {
    return { outcome: 'low-confidence', categorySuggestion: null };
  }
  const value = resolveCategoryJevCriterion(
    answer.choice,
    criteria,
    subscriptions,
  );
  if (!value) {
    return { outcome: 'unresolved', categorySuggestion: null };
  }
  return {
    outcome: 'suggested',
    categorySuggestion: { value, confidence: answer.confidence, similarCount },
  };
}
