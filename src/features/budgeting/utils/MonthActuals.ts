import Decimal from 'decimal.js';

import type { Category } from '~/features/categories/schema';
import {
  computeCategoryTotals,
  type Tx,
} from '~/shared/utils/computeCategoryTotals';

const ZERO = new Decimal(0);

/** Year-month key, e.g. '2026-4'. Month is 1-based. */
export type MonthKey = `${number}-${number}`;

/**
 * Actual transaction totals for a single month, computed bottom-up from
 * leaf (subcategory/rest) → category → typeGroup.
 */
export class MonthActuals {
  private readonly expenses: Decimal;
  private readonly income: Decimal;
  private readonly savings: Decimal;
  private readonly categoryTotals: Map<number, Decimal>;
  private readonly subcategoryTotals: Map<string, Decimal>;
  private readonly restTotals: Map<number, Decimal>;

  constructor(monthTx: Tx[], categories: Category[]) {
    const { categoryTotal, subcategoryTotal, restTotal } =
      computeCategoryTotals(monthTx, categories);
    this.categoryTotals = categoryTotal;
    this.subcategoryTotals = subcategoryTotal;
    this.restTotals = restTotal;

    let expenseTotal = ZERO;
    let incomeTotal = ZERO;
    let savingsTotal = ZERO;

    for (const category of categories) {
      const catTotal = this.categoryTotals.get(category.id) ?? ZERO;
      if (category.isIncome) {
        incomeTotal = incomeTotal.plus(catTotal);
      } else if (category.type === 'TO_SAVINGS') {
        savingsTotal = savingsTotal.plus(catTotal);
      } else {
        expenseTotal = expenseTotal.plus(catTotal);
      }
    }

    this.expenses = expenseTotal;
    this.income = incomeTotal;
    this.savings = savingsTotal;
  }

  /** Net total: income + expenses + savings. */
  getTotal(): Decimal {
    return this.income.plus(this.expenses).plus(this.savings);
  }

  getTotalExpenses(): Decimal {
    return this.expenses;
  }

  getTotalIncome(): Decimal {
    return this.income;
  }

  getTotalSavings(): Decimal {
    return this.savings;
  }

  getCategoryTotal(categoryId: number): Decimal {
    return this.categoryTotals.get(categoryId) ?? ZERO;
  }

  /** subcategoryId=null → rest row total */
  getSubcategoryTotal(
    categoryId: number,
    subcategoryId: number | null,
  ): Decimal {
    if (subcategoryId === null) {
      return this.restTotals.get(categoryId) ?? ZERO;
    }
    return this.subcategoryTotals.get(`${categoryId}-${subcategoryId}`) ?? ZERO;
  }
}
