import { describe, expect, it } from 'vitest';

import { toImportedTransactionCategoryValue } from './importedTransactionCategoryValue';

describe('toImportedTransactionCategoryValue', () => {
  it('returns the subscription value when the transaction has a subscription', () => {
    expect(
      toImportedTransactionCategoryValue({
        categoryId: 1,
        subcategoryId: 10,
        subscriptionId: 5,
      }),
    ).toBe('sub-5');
  });

  it('returns the category and subcategory value without a subscription', () => {
    expect(
      toImportedTransactionCategoryValue({
        categoryId: 1,
        subcategoryId: 10,
        subscriptionId: null,
      }),
    ).toBe('1-10');
  });

  it('returns the category value without a subcategory', () => {
    expect(
      toImportedTransactionCategoryValue({
        categoryId: 1,
        subcategoryId: null,
        subscriptionId: null,
      }),
    ).toBe('1');
  });
});
