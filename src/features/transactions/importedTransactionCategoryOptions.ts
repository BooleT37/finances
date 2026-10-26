import type {
  Category,
  Subcategory,
  Subscription,
} from '~/generated/prisma/client';

export interface ImportedTransactionCategoryGroup<C, S> {
  category: C;
  subscriptions: S[];
}

/**
 * What the import modal's category picker offers for a row of the given
 * sign: each category with its subcategories, plus the offered subscriptions
 * that belong to it. A subscription pointing at a subcategory the category no
 * longer has is left out, since the picker has nowhere to place it.
 */
export function groupImportedTransactionCategoryOptions<
  C extends Pick<Category, 'id' | 'isIncome'> & {
    subcategories: Pick<Subcategory, 'id'>[];
  },
  S extends Pick<Subscription, 'categoryId' | 'subcategoryId'>,
>({
  categories,
  subscriptions,
  isIncome,
}: {
  categories: C[];
  subscriptions: S[];
  isIncome: boolean;
}): ImportedTransactionCategoryGroup<C, S>[] {
  return categories
    .filter((category) => category.isIncome === isIncome)
    .map((category) => ({
      category,
      subscriptions: subscriptions.filter(
        (subscription) =>
          subscription.categoryId === category.id &&
          (subscription.subcategoryId === null ||
            category.subcategories.some(
              (subcategory) => subcategory.id === subscription.subcategoryId,
            )),
      ),
    }));
}
