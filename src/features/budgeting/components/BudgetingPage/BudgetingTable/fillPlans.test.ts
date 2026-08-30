import Decimal from 'decimal.js';

import type { ForecastLineItem } from '~/features/budgeting/schema';

import type { CurrentPlan, DueSubscription } from './fillFromSubscriptions';
import {
  buildCategoryFillPlans,
  buildSubcategoriesFillPlans,
  doesFillOverwriteExisting,
  isFillFullyApplied,
  mergeFillPlans,
} from './fillPlans';

function lineItem(
  id: number,
  unitPrice: string,
  subscriptionId: number | null = null,
): ForecastLineItem {
  return {
    id,
    unitPrice,
    quantity: new Decimal(1),
    comment: '',
    subscriptionId,
  };
}

function due(subscriptionId: number, cost = '10'): DueSubscription {
  return { subscriptionId, cost: new Decimal(cost), comment: '' };
}

function plan(lineItems: ForecastLineItem[]): CurrentPlan {
  return { lineItems, sum: new Decimal(0) };
}

describe('isFillFullyApplied', () => {
  it('is false for a plan with nothing due', () => {
    expect(isFillFullyApplied({ category: [], subcategories: [] })).toBe(false);
  });

  it('is true when a leaf category plan already has every due subscription', () => {
    const plans = buildCategoryFillPlans(1, plan([lineItem(1, '10', 7)]), [
      due(7),
    ]);
    expect(isFillFullyApplied(plans)).toBe(true);
  });

  it('is false while a leaf category plan is missing one', () => {
    const plans = buildCategoryFillPlans(1, plan([]), [due(7)]);
    expect(isFillFullyApplied(plans)).toBe(false);
  });

  it('requires every child of an aggregate plan to be fully applied', () => {
    const plans = mergeFillPlans([
      buildSubcategoriesFillPlans(1, [
        {
          subcategoryId: 10,
          current: plan([lineItem(1, '10', 7)]),
          due: [due(7)],
        },
      ]),
      buildSubcategoriesFillPlans(1, [
        { subcategoryId: 11, current: plan([]), due: [due(8)] },
      ]),
    ]);
    expect(isFillFullyApplied(plans)).toBe(false);
  });

  it('is true once every child of an aggregate plan is applied', () => {
    const plans = mergeFillPlans([
      buildSubcategoriesFillPlans(1, [
        {
          subcategoryId: 10,
          current: plan([lineItem(1, '10', 7)]),
          due: [due(7)],
        },
      ]),
      buildSubcategoriesFillPlans(1, [
        {
          subcategoryId: 11,
          current: plan([lineItem(2, '20', 8)]),
          due: [due(8)],
        },
      ]),
    ]);
    expect(isFillFullyApplied(plans)).toBe(true);
  });
});

describe('doesFillOverwriteExisting', () => {
  it('is false for a plan with nothing due', () => {
    expect(doesFillOverwriteExisting({ category: [], subcategories: [] })).toBe(
      false,
    );
  });

  it('is false when nothing in the plan is applied yet', () => {
    const plans = buildCategoryFillPlans(1, plan([]), [due(7)]);
    expect(doesFillOverwriteExisting(plans)).toBe(false);
  });

  it('is true when a leaf plan already has some of what is due', () => {
    const plans = buildCategoryFillPlans(1, plan([lineItem(1, '10', 7)]), [
      due(7),
      due(8),
    ]);
    expect(doesFillOverwriteExisting(plans)).toBe(true);
  });

  it('is true if only one child of an aggregate plan has an overlap', () => {
    const plans = mergeFillPlans([
      buildSubcategoriesFillPlans(1, [
        {
          subcategoryId: 10,
          current: plan([lineItem(1, '10', 7)]),
          due: [due(7)],
        },
      ]),
      buildSubcategoriesFillPlans(1, [
        { subcategoryId: 11, current: plan([]), due: [due(8)] },
      ]),
    ]);
    expect(doesFillOverwriteExisting(plans)).toBe(true);
  });
});
