import { describe, expect, it } from 'vitest';

import { groupImportedTransactionCategoryOptions } from './importedTransactionCategoryOptions';

const restaurants = {
  id: 1,
  name: 'Рестораны',
  isIncome: false,
  subcategories: [{ id: 10, name: 'Доставка' }],
};
const groceries = {
  id: 2,
  name: 'Продукты',
  isIncome: false,
  subcategories: [],
};
const salary = { id: 3, name: 'Зарплата', isIncome: true, subcategories: [] };

describe('groupImportedTransactionCategoryOptions', () => {
  it('keeps only the categories of the given sign', () => {
    const groups = groupImportedTransactionCategoryOptions({
      categories: [restaurants, groceries, salary],
      subscriptions: [],
      isIncome: false,
    });

    expect(groups.map(({ category }) => category.name)).toEqual([
      'Рестораны',
      'Продукты',
    ]);
  });

  it('attaches each subscription to its category', () => {
    const netflix = { id: 5, categoryId: 1, subcategoryId: null };
    const delivery = { id: 6, categoryId: 1, subcategoryId: 10 };

    const groups = groupImportedTransactionCategoryOptions({
      categories: [restaurants, groceries],
      subscriptions: [netflix, delivery],
      isIncome: false,
    });

    expect(groups).toEqual([
      { category: restaurants, subscriptions: [netflix, delivery] },
      { category: groceries, subscriptions: [] },
    ]);
  });

  it('leaves out a subscription whose subcategory the category no longer has', () => {
    const orphan = { id: 7, categoryId: 1, subcategoryId: 99 };

    const groups = groupImportedTransactionCategoryOptions({
      categories: [restaurants],
      subscriptions: [orphan],
      isIncome: false,
    });

    expect(groups[0]?.subscriptions).toEqual([]);
  });
});
