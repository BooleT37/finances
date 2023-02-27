import { categoryApi } from "./categoryApi";
import { expenseApi } from "./expenseApi";
import { forecastApi } from "./forecastApi";
import { savingSpendingApi } from "./savingSpendingApi";
import { savingSpendingCategoryApi } from "./savingSpendingCategoryApi";
import { sourceApi } from "./sourceApi";
import { subcategoryApi } from "./subcategoryApi";
import { subscriptionApi } from "./subscriptionApi";

export const api = {
  category: categoryApi,
  subcategory: subcategoryApi,
  expense: expenseApi,
  source: sourceApi,
  forecast: forecastApi,
  subscription: subscriptionApi,
  savingSpending: savingSpendingApi,
  savingSpendingCategory: savingSpendingCategoryApi,
};
