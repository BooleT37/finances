export interface MonthSpendings {
  spendings: number;
  diff: number;
}
export interface SubscriptionsItem {
  cost: number;
  name: string;
}

export interface ForecastSum {
  value: number;
  subscriptions: SubscriptionsItem[];
}

export interface ForecastTableItem {
  category: string;
  categoryId: number;
  average: number;
  monthsWithSpendings: string;
  lastMonth: MonthSpendings;
  thisMonth: MonthSpendings;
  sum: ForecastSum;
  comment: string;
}
