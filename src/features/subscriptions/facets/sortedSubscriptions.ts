import { useQuery } from '@tanstack/react-query';

import { useExpenseCategories } from '~/features/categories/facets/expenseCategories';
import { useIncomeCategories } from '~/features/categories/facets/incomeCategories';

import { getSubscriptionsQueryOptions } from '../queries';
import type { Subscription } from '../schema';

export function useSortedSubscriptions(): Subscription[] | undefined {
  const { data: subscriptions } = useQuery(getSubscriptionsQueryOptions());
  const expenseCategories = useExpenseCategories();
  const incomeCategories = useIncomeCategories();

  if (!subscriptions || !expenseCategories || !incomeCategories) {
    return undefined;
  }

  const orderedCategories = [...expenseCategories, ...incomeCategories];
  const positionMap = new Map(orderedCategories.map((c, i) => [c.id, i]));

  return [...subscriptions].sort((a, b) => {
    const posA = positionMap.get(a.categoryId) ?? Infinity;
    const posB = positionMap.get(b.categoryId) ?? Infinity;
    return posA - posB;
  });
}
