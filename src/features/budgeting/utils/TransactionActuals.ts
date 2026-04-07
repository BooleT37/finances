import type { Category } from '~/features/categories/schema';
import type { Transaction } from '~/features/transactions/schema';

import { MonthActuals, type MonthKey } from './MonthActuals';
import { TransactionAverages } from './TransactionAverages';
import { TransactionMatrix } from './TransactionMatrix';

/**
 * Entry point. Pass all transactions (two years) and the filtered+sorted
 * category list. All calculations run once in the constructor.
 */
export class TransactionActuals {
  readonly matrix: TransactionMatrix;
  readonly averages: TransactionAverages;

  constructor(transactions: Transaction[], categories: Category[]) {
    const grouped = Object.groupBy<MonthKey, Transaction>(
      transactions,
      (tx) => `${tx.date.year()}-${tx.date.month()}`,
    );

    const monthsMap = new Map<MonthKey, MonthActuals>();
    const allMonths: MonthActuals[] = [];

    for (const [key, txs] of Object.entries(grouped) as [
      MonthKey,
      Transaction[],
    ][]) {
      const actuals = new MonthActuals(txs ?? [], categories);
      monthsMap.set(key, actuals);
      allMonths.push(actuals);
    }

    this.matrix = new TransactionMatrix(monthsMap);
    this.averages = new TransactionAverages(allMonths, categories);
  }
}
