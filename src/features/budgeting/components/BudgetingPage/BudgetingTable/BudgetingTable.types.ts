import type Decimal from 'decimal.js';

import type { AvailableSubscription } from '~/features/subscriptions/facets/availableSubscriptions';

import type { BudgetingRowId } from './budgetingRowId';

export interface BudgetingGrandTotal {
  thisMonthActual: Decimal;
  lastMonthActual: Decimal;
  average: Decimal;
  monthCount: number;
  /** Estimated surplus: Σ(income planSums) + Σ(expense planSums) + Σ(savings planSums). */
  planSum: Decimal;
  lastMonthPlanSum: Decimal;
  /** All available subscriptions due this month */
  subscriptions: AvailableSubscription[];
}

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
  /** From category.isContinuous; drives orange bar for current-month cells. */
  isContinuous: boolean;
  /** Precomputed plan sum at every level. Negative for expense rows (adaptCost applied). */
  planSum: Decimal;
  /** Precomputed plan sum for the previous month. */
  lastMonthPlanSum: Decimal;
  /** '' if no DB record exists. Always '' for Rest and typeGroup rows. */
  comment: string;
  /** Signed actual total for the selected month. */
  thisMonthActual: Decimal;
  /** Signed actual total for the previous month. */
  lastMonthActual: Decimal;
  /** Average monthly actual over months with ≥1 transaction. */
  average: Decimal;
  /** Denominator for average; shown in tooltip. 0 means no data. */
  monthCount: number;
  /** Subscriptions due this month for this row's (categoryId, subcategoryId) pair. */
  subscriptions: AvailableSubscription[];
  subRows?: BudgetingRow[];
}
