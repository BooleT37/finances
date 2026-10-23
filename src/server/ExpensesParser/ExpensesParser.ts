import type { ParsedExpense } from '~/features/transactions/parsedExpense';

export interface IExpensesParser {
  parse(): Promise<ParsedExpense[]>;
}
