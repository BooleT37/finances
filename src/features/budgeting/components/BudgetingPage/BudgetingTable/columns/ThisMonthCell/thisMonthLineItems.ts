import type { Dayjs } from 'dayjs';
import type Decimal from 'decimal.js';

import type {
  Transaction,
  TransactionComponent,
} from '~/features/transactions/schema';
import { costWithoutComponents } from '~/features/transactions/utils/costWithoutComponents';

export interface ThisMonthLineItem {
  key: string;
  name: string;
  cost: Decimal;
  date: Dayjs;
}

/**
 * Which (categoryId, subcategoryId) pair a cell aggregates.
 * `subcategoryId: 'any'` matches a whole category (used for category-level rows);
 * `null` matches transactions/components with no subcategory (the "Other" row).
 */
export interface ThisMonthSelection {
  categoryId: number;
  subcategoryId: number | null | 'any';
}

/**
 * Builds the list of line items that make up a "this month" cell total, using
 * the same attribution as `computePairTotal`: a matching transaction
 * contributes its cost minus its components (the remainder), and any matching
 * component contributes its own cost — mirroring the transactions table.
 */
export function buildThisMonthLineItems(
  monthTransactions: Transaction[],
  selection: ThisMonthSelection,
  formatComponentName: (
    component: TransactionComponent,
    parent: Transaction,
  ) => string,
): ThisMonthLineItem[] {
  const matches = (categoryId: number, subcategoryId: number | null): boolean =>
    categoryId === selection.categoryId &&
    (selection.subcategoryId === 'any' ||
      subcategoryId === selection.subcategoryId);

  const items: ThisMonthLineItem[] = [];

  for (const tx of monthTransactions) {
    if (matches(tx.categoryId, tx.subcategoryId)) {
      items.push({
        key: `tx-${tx.id}`,
        name: tx.name,
        cost: costWithoutComponents(tx.cost, tx.components),
        date: tx.date,
      });
    }
    for (const component of tx.components) {
      if (matches(component.categoryId, component.subcategoryId)) {
        items.push({
          key: `component-${component.id}`,
          name: formatComponentName(component, tx),
          cost: component.cost,
          date: tx.date,
        });
      }
    }
  }

  return items.sort((a, b) => b.cost.abs().comparedTo(a.cost.abs()));
}
