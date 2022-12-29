export interface MonthSpendings {
  spendings: number;
  diff: number;
  isIncome: boolean;
}
export interface SubscriptionsItem {
  cost: number;
  name: string;
}

export interface ForecastSum {
  value: number | null;
  subscriptions: SubscriptionsItem[];
}

export interface ForecastTableItem {
  category: string;
  categoryId: number;
  categoryShortname: string;
  average: number;
  monthsWithSpendings: string;
  lastMonth: MonthSpendings;
  thisMonth: MonthSpendings;
  sum: ForecastSum;
  comment: string;
}
