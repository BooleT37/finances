import { buildCategorySubcategoryId } from '~/features/categories/categorySubcategoryId';
import { groupParsedExpenseCategoryOptions } from '~/features/transactions/parsedExpenseCategoryOptions';
import {
  buildSubscriptionValue,
  isSubscriptionValue,
  type ParsedExpenseCategoryValue,
  parseSubscriptionValue,
} from '~/features/transactions/parsedExpenseCategoryValue';
import type { Prisma, Subscription } from '~/generated/prisma/client';

export interface CategoryJevCriterion {
  value: ParsedExpenseCategoryValue;
  description: string;
}

/**
 * The import modal picker's options for one row, as Jev criteria with
 * plain-text descriptions.
 */
export function buildCategoryJevCriteria(params: {
  categories: Prisma.CategoryGetPayload<{ include: { subcategories: true } }>[];
  subscriptions: Subscription[];
  isIncome: boolean;
}): CategoryJevCriterion[] {
  return groupParsedExpenseCategoryOptions(params).flatMap(
    ({ category, subscriptions }) => {
      const fullName = (subcategoryId: number | null) => {
        const subcategory = category.subcategories.find(
          (s) => s.id === subcategoryId,
        );
        return subcategory
          ? `${category.name} - ${subcategory.name}`
          : category.name;
      };
      return [
        {
          value: buildCategorySubcategoryId({ categoryId: category.id }),
          description: category.name,
        },
        ...category.subcategories.map((subcategory) => ({
          value: buildCategorySubcategoryId({
            categoryId: category.id,
            subcategoryId: subcategory.id,
          }),
          description: fullName(subcategory.id),
        })),
        ...subscriptions.map((subscription) => ({
          value: buildSubscriptionValue(subscription.id),
          description: `Subscription "${subscription.name}" (${fullName(subscription.subcategoryId)})`,
        })),
      ];
    },
  );
}

/**
 * Maps a value to one of the row's criteria. A subscription that isn't
 * offered (already paid this period, inactive, or of the other sign) falls
 * back to its own category and subcategory. Returns null when nothing fits.
 */
export function resolveCategoryJevCriterion(
  value: ParsedExpenseCategoryValue,
  criteria: CategoryJevCriterion[],
  allSubscriptions: Subscription[],
): ParsedExpenseCategoryValue | null {
  const isOffered = (candidate: ParsedExpenseCategoryValue) =>
    criteria.some((criterion) => criterion.value === candidate);

  if (isOffered(value)) {
    return value;
  }
  if (!isSubscriptionValue(value)) {
    return null;
  }
  const subscriptionId = parseSubscriptionValue(value);
  const subscription = allSubscriptions.find((s) => s.id === subscriptionId);
  if (!subscription) {
    return null;
  }
  const fallback = buildCategorySubcategoryId(subscription);
  return isOffered(fallback) ? fallback : null;
}
