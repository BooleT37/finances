import type { Dayjs } from 'dayjs';
import Decimal from 'decimal.js';

import type { Category } from '~/features/categories/schema';
import {
  computeCategoryTotals,
  type Tx,
} from '~/shared/utils/computeCategoryTotals';

import type { ComparisonCategoryData } from '../schema';

export interface DatedTx extends Tx {
  date: Dayjs;
}

export interface ComparisonPeriod {
  start: Dayjs;
  end: Dayjs;
}

const ZERO = new Decimal(0);

function isInPeriod(tx: DatedTx, period: ComparisonPeriod): boolean {
  return (
    !tx.date.isBefore(period.start, 'day') &&
    !tx.date.isAfter(period.end, 'day')
  );
}

/**
 * Per-category cost magnitudes for two periods, for side-by-side comparison.
 * Categories with zero activity in both periods are omitted. Amounts are
 * absolute — sign doesn't matter when comparing period-over-period totals.
 */
export function aggregateComparisonData(
  transactions: DatedTx[],
  categories: Category[],
  period1: ComparisonPeriod,
  period2: ComparisonPeriod,
): ComparisonCategoryData[] {
  const period1Totals = computeCategoryTotals(
    transactions.filter((tx) => isInPeriod(tx, period1)),
    categories,
  ).categoryTotal;
  const period2Totals = computeCategoryTotals(
    transactions.filter((tx) => isInPeriod(tx, period2)),
    categories,
  ).categoryTotal;

  const result: ComparisonCategoryData[] = [];
  for (const category of categories) {
    const total1 = period1Totals.get(category.id) ?? ZERO;
    const total2 = period2Totals.get(category.id) ?? ZERO;
    if (total1.isZero() && total2.isZero()) {
      continue;
    }
    result.push({
      categoryId: category.id,
      period1: total1.abs().toNumber(),
      period2: total2.abs().toNumber(),
    });
  }
  return result;
}
