import type { Dayjs } from 'dayjs';
import Decimal from 'decimal.js';

import type { Category } from '~/features/categories/schema';
import { computeCategoryTotals } from '~/shared/utils/computeCategoryTotals';

import type { DynamicsMonthData } from '../schema';
import type { DatedTx } from './aggregateComparisonData';

const ZERO = new Decimal(0);

function monthKey(date: Dayjs): string {
  return date.format('YYYY-MM');
}

/**
 * Per-month, per-category cost magnitudes across [from, to]. Every month in
 * the range appears even with zero activity, so line charts don't have gaps.
 * If categoryIds is empty, includes every category that appears in the given
 * transactions (as either a transaction's or one of its components' own
 * category).
 */
export function aggregateDynamicsData(
  transactions: DatedTx[],
  categories: Category[],
  from: Dayjs,
  to: Dayjs,
  categoryIds: number[],
): DynamicsMonthData[] {
  const selectedCategoryIds =
    categoryIds.length > 0
      ? new Set(categoryIds)
      : new Set(
          transactions.flatMap((tx) => [
            tx.categoryId,
            ...tx.components.map((c) => c.categoryId),
          ]),
        );
  const selectedCategories = categories.filter((c) =>
    selectedCategoryIds.has(c.id),
  );

  const txByMonth = new Map<string, DatedTx[]>();
  for (const tx of transactions) {
    const key = monthKey(tx.date);
    const monthTx = txByMonth.get(key);
    if (monthTx) {
      monthTx.push(tx);
    } else {
      txByMonth.set(key, [tx]);
    }
  }

  const result: DynamicsMonthData[] = [];
  let cursor = from.startOf('month');
  const end = to.startOf('month');
  while (cursor.isBefore(end) || cursor.isSame(end, 'month')) {
    const key = monthKey(cursor);
    const { categoryTotal } = computeCategoryTotals(
      txByMonth.get(key) ?? [],
      selectedCategories,
    );
    const categoryValues: Record<string, number> = {};
    for (const category of selectedCategories) {
      categoryValues[category.id.toString()] = (
        categoryTotal.get(category.id) ?? ZERO
      )
        .abs()
        .toNumber();
    }
    // month + a dynamic per-category-id key can't be expressed as a single
    // object type without conflicting with the index signature, so build it
    // as two parts and cast.
    result.push({ month: key, ...categoryValues } as DynamicsMonthData);
    cursor = cursor.add(1, 'month');
  }
  return result;
}
