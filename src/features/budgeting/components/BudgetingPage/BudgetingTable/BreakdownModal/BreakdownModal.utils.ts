import Decimal from 'decimal.js';

import type { ForecastLineItem } from '~/features/budgeting/schema';
import { evaluateFormula } from '~/shared/utils/formula/evaluateFormula';

export interface BreakdownFormRow {
  unitPrice: string;
  quantity: string;
  comment: string;
  /** Carried through editing so a re-fill can still recognise its own rows. */
  subscriptionId: number | null;
}

export interface BreakdownFormValues {
  rows: BreakdownFormRow[];
}

export const EMPTY_BREAKDOWN_ROW: BreakdownFormRow = {
  unitPrice: '',
  quantity: '1',
  comment: '',
  subscriptionId: null,
};

export function lineItemsToFormRows(
  items: ForecastLineItem[],
): BreakdownFormRow[] {
  return items.map((item) => ({
    unitPrice: item.unitPrice,
    quantity: item.quantity.toString(),
    comment: item.comment,
    subscriptionId: item.subscriptionId,
  }));
}

/** Unlike the unit price, quantity is never a formula. */
export function parseQuantity(value: string): Decimal | null {
  const trimmed = value.trim();
  if (!/^\d+([.,]\d+)?$/.test(trimmed)) {
    return null;
  }
  const parsed = new Decimal(trimmed.replace(',', '.'));
  return parsed.isZero() ? null : parsed;
}

export function formRowsToLineItems(rows: BreakdownFormRow[]) {
  return rows.map((row) => ({
    unitPrice: row.unitPrice.trim(),
    quantity: row.quantity.trim().replace(',', '.'),
    comment: row.comment,
    subscriptionId: row.subscriptionId,
  }));
}

export function isPlainNumber(value: string): boolean {
  return /^-?\d+([.,]\d+)?$/.test(value.trim());
}

export function rowSubtotal(row: BreakdownFormRow): Decimal | null {
  const price = evaluateFormula(row.unitPrice);
  if (!price.ok) {
    return null;
  }
  const quantity = parseQuantity(row.quantity);
  if (!quantity) {
    return null;
  }
  return price.value.times(quantity);
}

/** Unparseable rows count as nothing, so the total keeps up while a row is half-typed. */
export function breakdownTotal(rows: BreakdownFormRow[]): Decimal {
  return rows.reduce(
    (total, row) => total.plus(rowSubtotal(row) ?? 0),
    new Decimal(0),
  );
}
