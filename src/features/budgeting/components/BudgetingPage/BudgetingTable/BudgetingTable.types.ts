import type Decimal from 'decimal.js';

import type { BudgetingRowId } from './budgetingRowId';

export type BudgetingRowType = 'typeGroup' | 'category' | 'subcategory';

export interface BudgetingRow {
  id: BudgetingRowId;
  rowType: BudgetingRowType;
  name: string;
  icon: string | null;
  /** null for typeGroup rows */
  categoryId: number | null;
  /** null for category rows; REST_SUBCATEGORY_ID (-1) for the rest row */
  subcategoryId: number | null;
  isRestRow: boolean;
  isIncome: boolean;
  /** Precomputed plan sum at every level. Negative for expense rows (adaptCost applied). */
  planSum: Decimal;
  /** '' if no DB record exists. Always '' for Rest and typeGroup rows. */
  comment: string;
  subRows?: BudgetingRow[];
}
