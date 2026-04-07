import Decimal from 'decimal.js';

import { decimalSum } from '~/shared/utils/decimalSum';

import type { MonthActuals } from './MonthActuals';

const ZERO = new Decimal(0);

export interface AverageResult {
  average: Decimal;
  monthCount: number;
}

const ZERO_AVERAGE: AverageResult = { average: ZERO, monthCount: 0 };

function computeAverage(values: Decimal[]): AverageResult {
  const nonZero = values.filter((v) => !v.isZero());
  const count = nonZero.length;
  return {
    average: count > 0 ? decimalSum(...nonZero).dividedBy(count) : ZERO,
    monthCount: count,
  };
}

/**
 * Pre-computed averages across all loaded months, at every level.
 * Zero-months are excluded from the denominator at each level independently,
 * so a parent category's average correctly reflects months where it had any
 * activity — regardless of which subcategory was active.
 */
export class TransactionAverages {
  private readonly expenseAvg: AverageResult;
  private readonly incomeAvg: AverageResult;
  private readonly categoryAvgs: Map<number, AverageResult>;
  private readonly subcategoryAvgs: Map<string, AverageResult>;
  private readonly restAvgs: Map<number, AverageResult>;

  constructor(
    allMonths: MonthActuals[],
    categories: { id: number; subcategories: { id: number }[] }[],
  ) {
    this.categoryAvgs = new Map();
    this.subcategoryAvgs = new Map();
    this.restAvgs = new Map();

    for (const category of categories) {
      const catId = category.id;
      this.categoryAvgs.set(
        catId,
        computeAverage(allMonths.map((m) => m.getCategoryTotal(catId))),
      );

      for (const sub of category.subcategories) {
        this.subcategoryAvgs.set(
          `${catId}-${sub.id}`,
          computeAverage(
            allMonths.map((m) => m.getSubcategoryTotal(catId, sub.id)),
          ),
        );
      }

      if (category.subcategories.length > 0) {
        this.restAvgs.set(
          catId,
          computeAverage(
            allMonths.map((m) => m.getSubcategoryTotal(catId, null)),
          ),
        );
      }
    }

    this.expenseAvg = computeAverage(
      allMonths.map((m) => m.getTotalExpenses()),
    );
    this.incomeAvg = computeAverage(allMonths.map((m) => m.getTotalIncome()));
  }

  getTotalExpenses(): AverageResult {
    return this.expenseAvg;
  }

  getTotalIncome(): AverageResult {
    return this.incomeAvg;
  }

  getCategoryTotal(categoryId: number): AverageResult {
    return this.categoryAvgs.get(categoryId) ?? ZERO_AVERAGE;
  }

  /** subcategoryId=null → rest row average */
  getSubcategoryTotal(
    categoryId: number,
    subcategoryId: number | null,
  ): AverageResult {
    if (subcategoryId === null) {
      return this.restAvgs.get(categoryId) ?? ZERO_AVERAGE;
    }
    return (
      this.subcategoryAvgs.get(`${categoryId}-${subcategoryId}`) ?? ZERO_AVERAGE
    );
  }
}
