import Decimal from 'decimal.js';

import type { Category } from '~/features/categories/schema';

import { decimalSum } from './decimalSum';

export interface TxComponent {
  cost: Decimal;
  categoryId: number;
  subcategoryId: number | null;
}

export interface Tx {
  cost: Decimal;
  categoryId: number;
  subcategoryId: number | null;
  components: TxComponent[];
}

const ZERO = new Decimal(0);

/**
 * Sum of costs attributed to a (categoryId, subcategoryId) pair from a
 * transaction list. Two-part: tx remainder (tx.cost minus its own
 * components' costs, so components aren't double-counted) + components
 * whose own categoryId/subcategoryId match the pair.
 * subcategoryId=null selects transactions not assigned to any named subcategory.
 */
function computePairTotal(
  txs: Tx[],
  categoryId: number,
  subcategoryId: number | null,
): Decimal {
  const matchesPair = (catId: number, subId: number | null): boolean =>
    catId === categoryId && subId === subcategoryId;

  const txPart = decimalSum(
    ...txs
      .filter((tx) => matchesPair(tx.categoryId, tx.subcategoryId))
      .map((tx) =>
        tx.cost.minus(decimalSum(...tx.components.map((c) => c.cost))),
      ),
  );

  const compPart = decimalSum(
    ...txs
      .flatMap((tx): TxComponent[] => tx.components)
      .filter((c) => matchesPair(c.categoryId, c.subcategoryId))
      .map((c) => c.cost),
  );

  return txPart.plus(compPart);
}

export interface CategoryTotals {
  categoryTotal: Map<number, Decimal>;
  subcategoryTotal: Map<string, Decimal>;
  /** subcategoryId=null "rest" row total, keyed by categoryId. */
  restTotal: Map<number, Decimal>;
}

/**
 * Sums transaction (+ component) costs per category/subcategory, bottom-up:
 * leaf (subcategory/rest) → category. Components are attributed to their own
 * categoryId/subcategoryId, not their parent transaction's.
 */
export function computeCategoryTotals(
  txs: Tx[],
  categories: Category[],
): CategoryTotals {
  const categoryTotal = new Map<number, Decimal>();
  const subcategoryTotal = new Map<string, Decimal>();
  const restTotal = new Map<number, Decimal>();

  for (const category of categories) {
    const catId = category.id;

    if (category.subcategories.length === 0) {
      categoryTotal.set(catId, computePairTotal(txs, catId, null));
      continue;
    }

    let subTotal = ZERO;
    for (const sub of category.subcategories) {
      const subActual = computePairTotal(txs, catId, sub.id);
      subcategoryTotal.set(`${catId}-${sub.id}`, subActual);
      subTotal = subTotal.plus(subActual);
    }
    const restActual = computePairTotal(txs, catId, null);
    restTotal.set(catId, restActual);
    categoryTotal.set(catId, subTotal.plus(restActual));
  }

  return { categoryTotal, subcategoryTotal, restTotal };
}
