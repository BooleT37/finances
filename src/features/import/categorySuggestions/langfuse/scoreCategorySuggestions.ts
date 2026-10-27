import { toImportedTransactionCategoryValue } from '~/features/import/importedTransactionCategoryValue';
import type { ImportTransactionsInput } from '~/features/import/schema';
import { prisma } from '~/server/db';
import {
  flushLangfuse,
  langfuseClient,
  langfuseEnvironment,
} from '~/server/langfuse';
import { getOrThrow } from '~/shared/utils/getOrThrow';

import { buildCategoryJevCriteria } from '../categoryJevCriteria';
import { buildCategorySuggestionScores } from './buildCategorySuggestionScores';

/**
 * Scores the traces of imported rows with the category they were imported
 * under, named the way Jev's criteria name it. A failure is only logged, so
 * scoring never fails the import.
 */
export async function scoreCategorySuggestions(
  items: ImportTransactionsInput,
  projectId: string,
): Promise<void> {
  const client = langfuseClient;
  const tracedItems = items.flatMap(({ categorySuggestionTrace, ...item }) =>
    categorySuggestionTrace ? [{ ...item, ...categorySuggestionTrace }] : [],
  );
  if (!client || tracedItems.length === 0) {
    return;
  }

  try {
    const [categories, subscriptions] = await Promise.all([
      prisma.category.findMany({
        where: { projectId },
        include: { subcategories: true },
      }),
      prisma.subscription.findMany({ where: { projectId } }),
    ]);
    const criteria = [
      ...buildCategoryJevCriteria({
        categories,
        subscriptions,
        isIncome: false,
      }),
      ...buildCategoryJevCriteria({
        categories,
        subscriptions,
        isIncome: true,
      }),
    ];
    const categoryNames = Object.fromEntries(
      criteria.map(({ value, description }) => [value, description]),
    );

    const scores = buildCategorySuggestionScores(
      tracedItems.map((item) => {
        const importedValue = toImportedTransactionCategoryValue({
          categoryId: item.categoryId,
          subcategoryId: item.subcategoryId ?? null,
          subscriptionId: item.subscriptionId ?? null,
        });
        return {
          traceId: item.traceId,
          suggestedValue: item.suggestedValue,
          importedValue,
          importedCategory: getOrThrow(
            categoryNames,
            importedValue,
            'Imported category',
          ),
        };
      }),
    );
    for (const score of scores) {
      client.score.create({ ...score, environment: langfuseEnvironment });
    }
  } catch (error) {
    console.error('Failed to score category suggestions', error);
  }
  await flushLangfuse();
}
