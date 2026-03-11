import { useSuspenseQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { getCategoryMapQueryOptions } from '~/features/categories/facets/categoryMap';
import { getSavingSpendingCategoryMapQueryOptions } from '~/features/savingSpendings/facets/savingSpendingCategoryMap';
import type { Transaction } from '~/features/transactions/schema';
import { getOrThrow } from '~/shared/utils/getOrThrow';

import type {
  TransactionFormValues,
  TransactionType,
} from './transactionFormValues';

export function useTransactionToFormValues(): (
  tx: Transaction,
) => TransactionFormValues {
  const { data: categoryMap } = useSuspenseQuery(getCategoryMapQueryOptions());
  const { data: savingSpendingCategoryMap } = useSuspenseQuery(
    getSavingSpendingCategoryMapQueryOptions(),
  );

  return useCallback(
    (tx: Transaction): TransactionFormValues => {
      const cat = categoryMap[tx.categoryId];
      const txType: TransactionType =
        cat?.type === 'FROM_SAVINGS'
          ? 'fromSavings'
          : cat?.isIncome
            ? 'income'
            : 'expense';
      const spendingCat =
        tx.savingSpendingCategoryId !== null
          ? getOrThrow(
              savingSpendingCategoryMap,
              tx.savingSpendingCategoryId,
              'SavingSpendingCategory',
            )
          : null;
      const savingSpendingId =
        spendingCat?.savingSpendingId != null
          ? String(spendingCat.savingSpendingId)
          : null;
      return {
        components: tx.components.map((c) => ({
          id: c.id,
          name: c.name,
          cost: c.cost.toString(),
          categoryId: c.categoryId,
          subcategoryId: c.subcategoryId,
        })),
        cost: tx.cost.toString(),
        name: tx.name,
        date: tx.date.toDate(),
        actualDate: tx.actualDate?.toDate() ?? null,
        category: String(tx.categoryId),
        subcategory:
          tx.subcategoryId !== null ? String(tx.subcategoryId) : null,
        source: tx.sourceId !== null ? String(tx.sourceId) : null,
        subscription:
          tx.subscriptionId !== null ? String(tx.subscriptionId) : null,
        savingSpendingCategoryId:
          tx.savingSpendingCategoryId !== null
            ? String(tx.savingSpendingCategoryId)
            : null,
        savingSpendingId,
        transactionType: txType,
      };
    },
    [categoryMap, savingSpendingCategoryMap],
  );
}
