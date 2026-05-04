import type { ParsedExpenseFromApi } from '~/features/transactions/parsedExpense';

export interface IExpensesParser {
  parse(): Promise<ParsedExpenseFromApi[]>;
}
