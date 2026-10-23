import { describe, expect, it } from 'vitest';

import {
  buildCategoryJevCriteria,
  resolveCategoryJevCriterion,
} from './categoryJevCriteria';
import { categoryRow, subscriptionRow } from './categorySuggestionsTestData';

const restaurants = categoryRow(1, 'Рестораны', [{ id: 10, name: 'Доставка' }]);
const groceries = categoryRow(2, 'Продукты');
const netflix = subscriptionRow(5, 'Netflix', 1, 10);

describe('buildCategoryJevCriteria', () => {
  it('describes categories, subcategories and subscriptions in words', () => {
    expect(
      buildCategoryJevCriteria({
        categories: [restaurants, groceries],
        subscriptions: [netflix],
        isIncome: false,
      }),
    ).toEqual([
      { value: '1', description: 'Рестораны' },
      { value: '1-10', description: 'Рестораны - Доставка' },
      {
        value: 'sub-5',
        description: 'Subscription "Netflix" (Рестораны - Доставка)',
      },
      { value: '2', description: 'Продукты' },
    ]);
  });
});

describe('resolveCategoryJevCriterion', () => {
  const criteria = buildCategoryJevCriteria({
    categories: [restaurants, groceries],
    subscriptions: [],
    isIncome: false,
  });

  it('keeps a value that is among the criteria', () => {
    expect(resolveCategoryJevCriterion('1-10', criteria, [netflix])).toBe(
      '1-10',
    );
  });

  it('falls back from a subscription that is not offered to its category and subcategory', () => {
    expect(resolveCategoryJevCriterion('sub-5', criteria, [netflix])).toBe(
      '1-10',
    );
  });

  it('returns null when nothing among the criteria fits', () => {
    expect(resolveCategoryJevCriterion('3', criteria, [netflix])).toBeNull();
  });
});
