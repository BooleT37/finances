import pMap from 'p-map';

import type { ImportedTransaction } from '~/features/transactions/importedTransaction';
import { prisma } from '~/server/db';
import { typesafe } from '~/server/typesafe';
import { assertOwnedByProject } from '~/shared/utils/assertOwnedByProject';
import { findByIdOrThrow } from '~/shared/utils/getOrThrow';

import { buildCategoryJevCriteria } from './categoryJevCriteria';
import {
  buildCategoryJevQuestion,
  type SimilarTransaction,
} from './categoryJevQuestion';
import {
  CATEGORY_SUGGESTION_CONCURRENCY,
  SIMILAR_TRANSACTIONS_LIMIT,
  toCategorySuggestion,
} from './categorySuggestion';
import { traceCategoryChoice } from './langfuse/traceCategoryChoice';
import { traceCategorySuggestion } from './langfuse/traceCategorySuggestion';
import { traceCategorySuggestions } from './langfuse/traceCategorySuggestions';
import { traceSimilarTransactions } from './langfuse/traceSimilarTransactions';

export async function suggestCategoriesForProject(
  {
    sourceId,
    subscriptionIds,
    importedTransactions,
  }: {
    sourceId: number;
    subscriptionIds: number[];
    importedTransactions: ImportedTransaction[];
  },
  { userId, projectId }: { userId: string; projectId: string },
) {
  const { categorySuggestionsEnabledAt } =
    await prisma.projectSetting.findUniqueOrThrow({
      where: { projectId },
      select: { categorySuggestionsEnabledAt: true },
    });
  if (categorySuggestionsEnabledAt === null) {
    throw new Error('Category autofill is turned off for this project');
  }
  if (!typesafe) {
    throw new Error('Category suggestions need TYPESAFE_API_KEY to be set');
  }
  const jev = typesafe;
  await assertOwnedByProject(prisma.source, sourceId, projectId, 'Source');

  const [categories, subscriptions] = await Promise.all([
    prisma.category.findMany({
      where: { projectId },
      include: { subcategories: true },
    }),
    prisma.subscription.findMany({ where: { projectId } }),
  ]);
  const offeredSubscriptions = subscriptions.filter((s) =>
    subscriptionIds.includes(s.id),
  );

  const findSimilarTransactions = (description: string, isIncome: boolean) =>
    prisma.$transaction(async (tx): Promise<SimilarTransaction[]> => {
      const ranked = await tx.$queryRaw<{ id: number; similarity: number }[]>`
        SELECT e.id, similarity(e."importedDescription", ${description}) AS similarity
        FROM "Expense" e
        JOIN "Category" c ON c.id = e."categoryId" AND c."projectId" = e."projectId"
        WHERE e."projectId" = ${projectId}
          AND e."sourceId" = ${sourceId}
          AND e."importedDescription" IS NOT NULL
          AND c."isIncome" = ${isIncome}
          AND similarity(e."importedDescription", ${description}) > 0
        ORDER BY similarity DESC, e.date, e.id
        LIMIT ${SIMILAR_TRANSACTIONS_LIMIT}
      `;
      const transactions = await tx.expense.findMany({
        where: { id: { in: ranked.map(({ id }) => id) } },
        include: { category: true },
      });
      return ranked.map(({ id, similarity }) => ({
        transaction: findByIdOrThrow(transactions, id, 'Similar transaction'),
        similarity,
      }));
    });

  const suggestCategory = (importedTransaction: ImportedTransaction) =>
    traceCategorySuggestion(importedTransaction, async () => {
      const isIncome = !importedTransaction.amount.isNegative();
      const criteria = buildCategoryJevCriteria({
        categories,
        subscriptions: offeredSubscriptions,
        isIncome,
      });
      const similarTransactions = await traceSimilarTransactions(
        {
          description: importedTransaction.description,
          sourceId,
          isIncome,
          criteria,
          subscriptions,
        },
        () =>
          findSimilarTransactions(importedTransaction.description, isIncome),
      );
      const { state, question } = buildCategoryJevQuestion(
        importedTransaction,
        criteria,
        similarTransactions.map(({ transaction }) => transaction),
        subscriptions,
      );
      const answer = await traceCategoryChoice(state, question, () =>
        jev.askChoice(state, question),
      );
      return toCategorySuggestion({
        answer,
        criteria,
        subscriptions,
        similarCount: state.similar_past_transactions.length,
      });
    });

  return traceCategorySuggestions({ userId, sourceId }, () =>
    pMap(importedTransactions, suggestCategory, {
      concurrency: CATEGORY_SUGGESTION_CONCURRENCY,
    }),
  );
}
