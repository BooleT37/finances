import Decimal from 'decimal.js';

import type { Category } from '~/features/categories/schema';
import { decimalSum } from '~/shared/utils/decimalSum';

type TxComponent = Pick<
  import('~/features/transactions/schema').TransactionComponent,
  'cost' | 'categoryId' | 'subcategoryId'
>;

type Tx = Pick<
  import('~/features/transactions/schema').Transaction,
  'cost' | 'categoryId' | 'subcategoryId'
> & { components: TxComponent[] };

const ZERO = new Decimal(0);

/** Year-month key, e.g. '2026-4'. Month is 1-based. */
export type MonthKey = `${number}-${number}`;

/**
 * Sum of costs attributed to a (categoryId, subcategoryId) pair from an
 * already month-filtered transaction list. Two-part: tx remainder + components.
 * subcategoryId=null selects transactions not assigned to any named subcategory.
 */
function computePairTotal(
  monthTx: Tx[],
  categoryId: number,
  subcategoryId: number | null,
): Decimal {
  const matchesPair = (catId: number, subId: number | null): boolean =>
    catId === categoryId && subId === subcategoryId;

  const txPart = decimalSum(
    ...monthTx
      .filter((tx) => matchesPair(tx.categoryId, tx.subcategoryId))
      .map((tx) =>
        tx.cost.minus(decimalSum(...tx.components.map((c) => c.cost))),
      ),
  );

  const compPart = decimalSum(
    ...monthTx
      .flatMap((tx): TxComponent[] => tx.components)
      .filter((c) => matchesPair(c.categoryId, c.subcategoryId))
      .map((c) => c.cost),
  );

  return txPart.plus(compPart);
}

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
    this.categoryTotals = new Map();
    this.subcategoryTotals = new Map();
    this.restTotals = new Map();

    let expenseTotal = ZERO;
    let incomeTotal = ZERO;
    let savingsTotal = ZERO;

    for (const category of categories) {
      const catId = category.id;

      if (category.subcategories.length === 0) {
        const total = computePairTotal(monthTx, catId, null);
        this.categoryTotals.set(catId, total);
      } else {
        let subTotal = ZERO;
        for (const sub of category.subcategories) {
          const subActual = computePairTotal(monthTx, catId, sub.id);
          this.subcategoryTotals.set(`${catId}-${sub.id}`, subActual);
          subTotal = subTotal.plus(subActual);
        }
        const restActual = computePairTotal(monthTx, catId, null);
        this.restTotals.set(catId, restActual);
        this.categoryTotals.set(catId, subTotal.plus(restActual));
      }

      const catTotal = this.categoryTotals.get(catId)!;
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
