import sum from "lodash/sum";
import { PersonalExpCategoryIds } from "../../../models/Category";
import categories from "../../../readonlyStores/categories";
import expenseStore from "../../../stores/expenseStore";
import forecastStore from "../../../stores/forecastStore";

export const useForecastSum = (
  date: moment.Moment | null,
  categoryId: PersonalExpCategoryIds | null
) => {
  if (categoryId === null) {
    return undefined;
  }
  const forecast =
    date && categoryId !== null
      ? forecastStore.find(
          date.year(),
          date.month(),
          categories.getById(categoryId)
        )?.sum
      : undefined;
  if (forecast === undefined) {
    return undefined;
  }
  const spent = sum(
    expenseStore.expensesByCategoryId[categoryId]
      .filter((expense) => expense.date.isSame(date, "month"))
      .map((expense) => expense.cost ?? 0)
  );

  return forecast - spent;
};
