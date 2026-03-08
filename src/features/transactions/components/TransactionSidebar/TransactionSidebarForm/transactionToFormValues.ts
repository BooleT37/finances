import type { Transaction } from '~/features/transactions/schema';

import type { TransactionFormValues } from './transactionFormValues';

export function transactionToFormValues(
  tx: Transaction,
): TransactionFormValues {
  return {
    cost: tx.cost.toString(),
    name: tx.name,
    date: tx.date.toDate(),
    actualDate: tx.actualDate?.toDate() ?? null,
    category: String(tx.categoryId),
    subcategory: tx.subcategoryId !== null ? String(tx.subcategoryId) : null,
    source: tx.sourceId !== null ? String(tx.sourceId) : null,
    subscription: tx.subscriptionId !== null ? String(tx.subscriptionId) : null,
    savingSpendingCategoryId:
      tx.savingSpendingCategoryId !== null
        ? String(tx.savingSpendingCategoryId)
        : null,
  };
}
