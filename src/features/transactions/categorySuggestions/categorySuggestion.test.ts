import { describe, expect, it } from 'vitest';

import { buildCategoryJevCriteria } from './categoryJevCriteria';
import {
  type CategoryJevChoice,
  UNKNOWN_JEV_CHOICE,
} from './categoryJevQuestion';
import { toCategorySuggestion } from './categorySuggestion';
import { categoryRow, subscriptionRow } from './categorySuggestionsTestData';

const restaurants = categoryRow(1, 'Рестораны', [{ id: 10, name: 'Доставка' }]);
const netflix = subscriptionRow(5, 'Netflix', 1, 10);
const criteria = buildCategoryJevCriteria({
  categories: [restaurants],
  subscriptions: [],
  isIncome: false,
});

const suggest = (choice: CategoryJevChoice, confidence: number) =>
  toCategorySuggestion({
    answer: {
      choice,
      confidence,
      probabilities: {
        [UNKNOWN_JEV_CHOICE]: 1 - confidence,
        [choice]: confidence,
      },
    },
    criteria,
    subscriptions: [netflix],
    similarCount: 3,
  });

describe('toCategorySuggestion', () => {
  it('reports an unknown choice', () => {
    expect(suggest(UNKNOWN_JEV_CHOICE, 0.99)).toEqual({
      outcome: 'unknown',
      categorySuggestion: null,
    });
  });

  it('reports a choice below the confidence threshold', () => {
    expect(suggest('1-10', 0.79)).toEqual({
      outcome: 'low-confidence',
      categorySuggestion: null,
    });
  });

  it('suggests a choice at the confidence threshold', () => {
    expect(suggest('1-10', 0.8)).toEqual({
      outcome: 'suggested',
      categorySuggestion: { value: '1-10', confidence: 0.8, similarCount: 3 },
    });
  });

  it('falls back from a subscription that is not offered to its category and subcategory', () => {
    expect(suggest('sub-5', 0.9)).toEqual({
      outcome: 'suggested',
      categorySuggestion: { value: '1-10', confidence: 0.9, similarCount: 3 },
    });
  });

  it('reports a choice that resolves to none of the criteria', () => {
    expect(suggest('2', 0.95)).toEqual({
      outcome: 'unresolved',
      categorySuggestion: null,
    });
  });
});
