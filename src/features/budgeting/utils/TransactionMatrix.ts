import { MonthActuals, type MonthKey } from './MonthActuals';

const EMPTY_MONTH_ACTUALS = new MonthActuals([], []);

/**
 * Matrix of MonthActuals instances keyed by year-month.
 * Returns an empty (all-zero) MonthActuals for months with no transactions.
 */
export class TransactionMatrix {
  private readonly months: Map<MonthKey, MonthActuals>;

  constructor(months: Map<MonthKey, MonthActuals>) {
    this.months = months;
  }

  getMonthActuals(month: number, year: number): MonthActuals {
    return this.months.get(`${year}-${month}`) ?? EMPTY_MONTH_ACTUALS;
  }
}
