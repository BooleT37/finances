import type { CurrentPlan, DueSubscription } from './fillFromSubscriptions';
import {
  areAllSubscriptionsApplied,
  hasAnySubscriptionAlreadyApplied,
} from './fillFromSubscriptions';

export interface CategoryFillPlan {
  categoryId: number;
  current: CurrentPlan;
  due: DueSubscription[];
}

export interface SubcategoriesFillPlan {
  categoryId: number;
  items: {
    subcategoryId: number | null;
    current: CurrentPlan;
    due: DueSubscription[];
  }[];
}

/**
 * A category with children never has its own value written directly, so any
 * one category lands in one list or the other, never both.
 */
export interface SubscriptionsFillPlans {
  category: CategoryFillPlan[];
  subcategories: SubcategoriesFillPlan[];
}

export function buildCategoryFillPlans(
  categoryId: number,
  current: CurrentPlan,
  due: DueSubscription[],
): SubscriptionsFillPlans {
  return {
    category: due.length === 0 ? [] : [{ categoryId, current, due }],
    subcategories: [],
  };
}

/** `subcategoryId: null` is the Rest row. */
export function buildSubcategoriesFillPlans(
  categoryId: number,
  children: SubcategoriesFillPlan['items'],
): SubscriptionsFillPlans {
  const items = children.filter((child) => child.due.length > 0);
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

function fillPlanItems(
  plans: SubscriptionsFillPlans,
): { current: CurrentPlan; due: DueSubscription[] }[] {
  return [
    ...plans.category,
    ...plans.subcategories.flatMap((plan) => plan.items),
  ];
}

export function isFillFullyApplied(plans: SubscriptionsFillPlans): boolean {
  const items = fillPlanItems(plans);
  return (
    items.length > 0 &&
    items.every((item) => areAllSubscriptionsApplied(item.current, item.due))
  );
}

export function doesFillOverwriteExisting(
  plans: SubscriptionsFillPlans,
): boolean {
  return fillPlanItems(plans).some((item) =>
    hasAnySubscriptionAlreadyApplied(item.current, item.due),
  );
}
