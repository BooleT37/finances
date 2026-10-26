import dayjs from 'dayjs';

import type { ImportedTransaction } from '~/features/transactions/importedTransaction';
import {
  type ImportedTransactionCategoryValue,
  toImportedTransactionCategoryValue,
} from '~/features/transactions/importedTransactionCategoryValue';
import type { Prisma, Subscription } from '~/generated/prisma/client';
import { ISO_DATE_FORMAT } from '~/shared/constants';
import { adaptCost } from '~/shared/utils/adaptCost';

import {
  type CategoryJevCriterion,
  resolveCategoryJevCriterion,
} from './categoryJevCriteria';

export type ExpenseWithCategory = Prisma.ExpenseGetPayload<{
  include: { category: true };
}>;

export interface SimilarTransaction {
  transaction: ExpenseWithCategory;
  similarity: number;
}

export const UNKNOWN_JEV_CHOICE = 'unknown';

export type CategoryJevChoice =
  | ImportedTransactionCategoryValue
  | typeof UNKNOWN_JEV_CHOICE;

export const describeImportedTransaction = (
  importedTransaction: ImportedTransaction,
) => ({
  description: importedTransaction.description,
  amount: importedTransaction.amount.toFixed(2),
  date: importedTransaction.date.format(ISO_DATE_FORMAT),
});

/**
 * A similar transaction as Jev sees it, filed under the criterion its category
 * resolves to, or under `null` when it no longer resolves to any of them.
 */
export function describeSimilarTransaction(
  similar: ExpenseWithCategory,
  criteria: CategoryJevCriterion[],
  subscriptions: Subscription[],
) {
  const value = resolveCategoryJevCriterion(
    toImportedTransactionCategoryValue(similar),
    criteria,
    subscriptions,
  );
  return {
    description: similar.importedDescription ?? '',
    amount: adaptCost(similar.cost, similar.category.isIncome).toFixed(2),
    date: dayjs(similar.date).format(ISO_DATE_FORMAT),
    filed_under: criteria.find((c) => c.value === value)?.description ?? null,
  };
}

/**
 * The request Jev answers for one imported transaction. A similar transaction that
 * no longer resolves to any of the row's criteria is left out.
 */
export function buildCategoryJevQuestion(
  importedTransaction: ImportedTransaction,
  criteria: CategoryJevCriterion[],
  similarTransactions: ExpenseWithCategory[],
  subscriptions: Subscription[],
) {
  const criteriaByChoice: Record<CategoryJevChoice, string> = {
    [UNKNOWN_JEV_CHOICE]:
      'None of the other options fits, or the description is not enough to tell.',
  };
  for (const criterion of criteria) {
    criteriaByChoice[criterion.value] = criterion.description;
  }

  return {
    state: {
      transaction: describeImportedTransaction(importedTransaction),
      similar_past_transactions: similarTransactions.flatMap((similar) => {
        const { filed_under, ...described } = describeSimilarTransaction(
          similar,
          criteria,
          subscriptions,
        );
        return filed_under === null ? [] : [{ ...described, filed_under }];
      }),
    },
    question: {
      instructions:
        'Which category should the bank transaction `transaction` be filed under? `similar_past_transactions` are earlier transactions from the same bank account, each with the category it was filed under. A similar description usually means the same merchant, and the same merchant is usually filed the same way.',
      criteria: criteriaByChoice,
    },
  };
}
