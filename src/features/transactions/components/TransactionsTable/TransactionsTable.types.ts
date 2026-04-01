import type Decimal from 'decimal.js';

export const UPCOMING_SUBSCRIPTION_ID = -1;

/** Mirrors CostCol from finances-t3/src/features/expense/Expense.ts */
export interface CostColValue {
  cost: Decimal;
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
  cost: CostColValue | null;
  date: string; // formatted with DATE_FORMAT, e.g. '15.02.2026'
  category: string; // category.name
  categoryId: number;
  categoryShortname: string;
  categoryIcon: string | null;
  subcategory: string | null; // subcategory.name, or null
  subcategoryId: number | null;
  source: string; // source.name, or '' when source is null
  isUpcomingSubscription: boolean;
  isFromSavings: boolean;
  expenseId: number | null; // null for regular rows; parent id for components
  isIncome: boolean;
  isContinuous: boolean;
}
