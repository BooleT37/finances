import type Decimal from 'decimal.js';

import type { AvailableSubscription } from '~/features/subscriptions/facets/availableSubscriptions';
import { decimalSum } from '~/shared/utils/decimalSum';

/** Fills a category's own value directly — it has no subcategories. */
export interface CategoryFillPlan {
  categoryId: number;
  enteredAbs: Decimal;
}

/** Fills a category's subcategory/Rest children (`subcategoryId: null`). */
export interface SubcategoriesFillPlan {
  categoryId: number;
  items: { subcategoryId: number | null; enteredAbs: Decimal }[];
}

/**
 * What filling a row from its subscriptions writes. A category with children
 * never has its own value written directly (the server derives it), so any
 * one category lands in one list or the other, never both.
 */
export interface SubscriptionsFillPlans {
  category: CategoryFillPlan[];
  subcategories: SubcategoriesFillPlan[];
}

function subscriptionsTotal(subs: AvailableSubscription[]): Decimal {
  return decimalSum(...subs.map((s) => s.subscription.cost.abs()));
}

/** Plans for a category row with no subcategories — fills its own value. */
export function buildCategoryFillPlans(
  categoryId: number,
  subs: AvailableSubscription[],
): SubscriptionsFillPlans {
  return {
    category:
      subs.length === 0
        ? []
        : [{ categoryId, enteredAbs: subscriptionsTotal(subs) }],
    subcategories: [],
  };
}

/**
 * Plans for subcategory/Rest rows of one category — a single row on its own,
 * or all of a category's children. `subcategoryId: null` is the Rest row.
 */
export function buildSubcategoriesFillPlans(
  categoryId: number,
  children: { subcategoryId: number | null; subs: AvailableSubscription[] }[],
): SubscriptionsFillPlans {
  const items = children
    .filter((child) => child.subs.length > 0)
    .map((child) => ({
      subcategoryId: child.subcategoryId,
      enteredAbs: subscriptionsTotal(child.subs),
    }));
  return {
    category: [],
    subcategories: items.length === 0 ? [] : [{ categoryId, items }],
  };
}

/** Merges plans across rows — a type group's categories, or the whole table. */
export function mergeFillPlans(
  plans: SubscriptionsFillPlans[],
): SubscriptionsFillPlans {
  return {
    category: plans.flatMap((p) => p.category),
    subcategories: plans.flatMap((p) => p.subcategories),
  };
}

/** How many rows `plans` would write — categories plus subcategory/Rest items. */
export function countFilledRows(plans: SubscriptionsFillPlans): number {
  return (
    plans.category.length +
    plans.subcategories.reduce((n, plan) => n + plan.items.length, 0)
  );
}
