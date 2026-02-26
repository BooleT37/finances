import type Decimal from 'decimal.js';

export const UPCOMING_SUBSCRIPTION_ID = -1;

/** Mirrors CostCol from finances-t3/src/features/expense/Expense.ts */
export interface CostCol {
  value: Decimal;
  isSubscription?: boolean; // true for subscription expenses
  isUpcomingSubscription?: boolean;
  isIncome?: boolean;
  parentExpenseName?: string; // set on transaction component rows
  costWithComponents?: Decimal; // set on parent rows that have components
}

/** One row in the transactions MRT table. Mirrors ExpenseTableData from finances-t3. */
export interface TransactionTableItem {
  id: number;
  name: string;
  cost: CostCol | null;
  date: string; // ISO string, e.g. '2026-02-15T...'
  category: string; // category.name
  categoryId: number;
  categoryShortname: string;
  categoryIcon: string | null;
  subcategory: string | null; // subcategory.name, or null
  subcategoryId: number | null;
  source: string; // source.name, or '' when source is null
  isUpcomingSubscription: boolean;
  expenseId: number | null; // null for regular rows; parent id for components
  isIncome: boolean;
  isContinuous: boolean;
}
