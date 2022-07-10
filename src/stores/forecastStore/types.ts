export interface MonthSpendings {
  spendings: number;
  diff: number;
}

export interface ForecastTableItem {
  category: string;
  isIncome: boolean;
  average: number;
  monthsWithSpendings: string;
  lastMonth: MonthSpendings;
  thisMonth: MonthSpendings;
  sum: number;
  comment: string;
}
