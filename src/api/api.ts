import { categoryApi } from "./categoryApi";
import { expenseApi } from "./expenseApi";
import { forecastApi } from "./forecastApi";
import { savingSpendingApi } from "./savingSpendingApi";
import { savingSpendingCategoryApi } from "./savingSpendingCategoryApi";
import { sourceApi } from "./sourceApi";
import { subscriptionApi } from "./subscriptionApi";

export const api = {
  category: categoryApi,
  expense: expenseApi,
  source: sourceApi,
  forecast: forecastApi,
  subscription: subscriptionApi,
  savingSpending: savingSpendingApi,
  savingSpendingCategory: savingSpendingCategoryApi,
};
