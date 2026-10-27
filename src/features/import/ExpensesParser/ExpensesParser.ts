import type { ImportedTransaction } from '~/features/import/importedTransaction';

export interface IExpensesParser {
  parse(): Promise<ImportedTransaction[]>;
}
