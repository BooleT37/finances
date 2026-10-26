import {
  buildCategorySubcategoryId,
  type CategorySubcategoryId,
} from '~/features/categories/categorySubcategoryId';

const SUBSCRIPTION_PREFIX = 'sub-';

export type ImportedTransactionCategoryValue =
  | CategorySubcategoryId
  | `${typeof SUBSCRIPTION_PREFIX}${number}`;

export function buildSubscriptionValue(
  subscriptionId: number,
): `${typeof SUBSCRIPTION_PREFIX}${number}` {
  return `${SUBSCRIPTION_PREFIX}${subscriptionId}`;
}

export function isSubscriptionValue(
  value: string,
): value is `${typeof SUBSCRIPTION_PREFIX}${number}` {
  return value.startsWith(SUBSCRIPTION_PREFIX);
}

export function toImportedTransactionCategoryValue(transaction: {
  categoryId: number;
  subcategoryId: number | null;
  subscriptionId: number | null;
}): ImportedTransactionCategoryValue {
  return transaction.subscriptionId !== null
    ? buildSubscriptionValue(transaction.subscriptionId)
    : buildCategorySubcategoryId(transaction);
}

export function parseSubscriptionValue(
  value: `${typeof SUBSCRIPTION_PREFIX}${number}`,
): number {
  return parseInt(value.slice(SUBSCRIPTION_PREFIX.length), 10);
}
