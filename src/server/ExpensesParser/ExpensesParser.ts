import type { ImportedTransaction } from '~/features/transactions/importedTransaction';

export interface IExpensesParser {
  parse(): Promise<ImportedTransaction[]>;
}
