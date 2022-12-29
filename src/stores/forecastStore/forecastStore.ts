import { default as lodashSum, default as sum } from "lodash/sum";
import { makeAutoObservable, observable } from "mobx";
import { computedFn } from "mobx-utils";
import { api } from "../../api";
import { ForecastJson } from "../../api/forecastApi";
import {
  MONTH_DATE_FORMAT,
  PE_SUM_DEFAULT,
  PE_SUM_LS_KEY,
} from "../../constants";
import Category, {
  CATEGORY_IDS,
  PersonalExpCategoryIds,
} from "../../models/Category";
import Forecast from "../../models/Forecast";
import categories from "../../readonlyStores/categories";
import { countUniqueMonths, roundCost } from "../../utils";
import { negateIf } from "../../utils/negateIf";
import expenseStore from "../expenseStore";
import subscriptionStore from "../subscriptionStore";
import { ForecastTableItem } from "./types";
import { avgForNonEmpty, getPreviousMonth } from "./utils";

class ForecastStore {
  public forecasts = observable.array<Forecast>();

  constructor() {
    makeAutoObservable(this);
  }

  find(year: number, month: number, category: Category) {
    return this.forecasts.find(
      (f) =>
        f.year === year && f.month === month && f.category.id === category.id
    );
  }

  tableData = computedFn(
    (
      year: number,
      month: number,
      isIncome: boolean,
      isPersonal: boolean,
      isSavings: boolean
    ): ForecastTableItem[] => {
      const filtered = this.forecasts.filter((forecast) => {
        return (
          forecast.month === month &&
          forecast.year === year &&
          forecast.category.isIncome === isIncome &&
          forecast.category.isPersonal === isPersonal &&
          forecast.category.isSavings === isSavings
        );
      });

      let filteredCategories: Category[];

      if (isIncome) {
        filteredCategories = categories.incomeCategories;
      } else if (isPersonal) {
        filteredCategories = categories.personalExpensesCategories;
      } else if (isSavings) {
        filteredCategories = categories.savingsCategories;
      } else {
        filteredCategories = categories.generalExpenseCategories;
      }
      filteredCategories
        .sort((a, b) => a.id - b.id)
        .forEach((category) => {
          if (filtered.every((f) => f.category.id !== category.id)) {
            filtered.push(new Forecast(category, month, year, 0));
          }
        });
      const data = filtered.map((forecast) => {
        const { month: prevMonth, year: prevYear } = getPreviousMonth(
          forecast.month,
          forecast.year
        );
        const lastMonthForecast =
          this.forecasts.find(
            ({ category, month, year }) =>
              category === forecast.category &&
              month === prevMonth &&
              year === prevYear
          )?.sum ?? 0;

        const lastMonthSpendings = roundCost(
          sum(
            expenseStore.expenses
              .filter(
                (e) =>
                  e.date.month() === prevMonth &&
                  e.date.year() === prevYear &&
                  e.category.id === forecast.category.id
              )
              .map((e) => e.cost)
          )
        );

        const thisMonthSpendings = roundCost(
          sum(
            expenseStore.expenses
              .filter(
                (e) =>
                  e.date.month() === month &&
                  e.date.year() === year &&
                  e.category.id === forecast.category.id
              )
              .map((e) => e.cost)
          )
        );

        const { toSavings } = forecast.category;

        return {
          category: forecast.category.name,
          categoryId: forecast.category.id,
          categoryShortname: forecast.category.shortname,
          average: avgForNonEmpty(
            Object.values(
              expenseStore.expenses
                .filter((e) => e.category.id === forecast.category.id)
                .reduce<Record<string, number>>((a, c) => {
                  const month = c.date.format(MONTH_DATE_FORMAT);
                  if (a[month]) {
                    a[month] += c.cost ?? 0;
                  } else {
                    a[month] = c.cost ?? 0;
                  }
                  return a;
                }, {})
            )
          ),
          monthsWithSpendings: `${countUniqueMonths(
            expenseStore.expenses
              .filter((e) => e.category.id === forecast.category.id)
              .map((e) => e.date)
          )} / ${expenseStore.totalMonths} месяцев`,
          lastMonth: {
            spendings: lastMonthSpendings,
            diff: forecast.category.fromSavings
              ? 0
              : negateIf(
                  roundCost(lastMonthForecast - lastMonthSpendings),
                  isIncome || toSavings
                ),
            isIncome: forecast.category.isIncome,
          },
          thisMonth: {
            spendings: thisMonthSpendings,
            diff: forecast.category.fromSavings
              ? 0
              : negateIf(
                  roundCost(forecast.sum - thisMonthSpendings),
                  isIncome || toSavings
                ),
            isIncome: forecast.category.isIncome,
          },
          sum: {
            value: forecast.category.fromSavings ? null : forecast.sum,
            subscriptions: subscriptionStore.getSubscriptionsForForecast(
              month,
              year,
              forecast.category
            ),
          },
          comment: forecast.comment || "",
        };
      });

      if (!isPersonal) {
        data.push({
          average: roundCost(sum(data.map((d) => d.average))),
          monthsWithSpendings: "",
          category: "Всего",
          categoryId: -1,
          categoryShortname: "Всего",
          comment: "",
          lastMonth: {
            spendings: roundCost(
              sum(
                data.map((d) =>
                  negateIf(
                    d.lastMonth.spendings,
                    d.categoryId === CATEGORY_IDS.fromSavings
                  )
                )
              )
            ),
            diff: isSavings
              ? 0
              : roundCost(sum(data.map((d) => d.lastMonth.diff))),
            isIncome: false,
          },
          sum: {
            value: isSavings
              ? null
              : roundCost(
                  sum(
                    data.map((d) =>
                      negateIf(
                        d.sum.value ?? 0,
                        d.categoryId === CATEGORY_IDS.fromSavings
                      )
                    )
                  )
                ),
            subscriptions: isIncome
              ? []
              : subscriptionStore.getSubscriptionsForForecast(
                  month,
                  year,
                  null
                ),
          },
          thisMonth: {
            spendings: roundCost(
              sum(
                data.map((d) =>
                  negateIf(
                    d.thisMonth.spendings,
                    d.categoryId === CATEGORY_IDS.fromSavings
                  )
                )
              )
            ),
            diff: isSavings
              ? 0
              : roundCost(sum(data.map((d) => d.thisMonth.diff))),
            isIncome: false,
          },
        });
      }

      return data;
    }
  );

  totalForMonth(
    year: number,
    month: number,
    isIncome: boolean,
    isPersonal: boolean
  ) {
    return sum(
      this.forecasts
        .filter(
          (forecast) =>
            forecast.month === month &&
            forecast.year === year &&
            forecast.category.isIncome === isIncome &&
            forecast.category.isPersonal === isPersonal &&
            !forecast.category.fromSavings
        )
        .map((f) => f.sum)
    );
  }

  categoriesForecast = computedFn(
    (year: number, month: number): Record<number, number> => {
      return Object.fromEntries(
        this.forecasts
          .filter((f) => f.month === month && f.year === year)
          .map((f) => [f.category.id, f.sum])
      );
    }
  );

  fromJson(json: ForecastJson[]) {
    this.forecasts.replace(
      json.map(
        (f) =>
          new Forecast(
            categories.getById(f.category_id),
            f.month,
            f.year,
            f.sum,
            f.comment
          )
      )
    );
  }

  async changeForecastSum(
    category: Category,
    month: number,
    year: number,
    sum: number
  ): Promise<Response> {
    const forecast = this.forecasts.find(
      (f) =>
        f.category.id === category.id && f.month === month && f.year === year
    );
    if (forecast) {
      forecast.sum = sum;
      return api.forecast.modify(
        { sum },
        { category_id: category.id, month, year }
      );
    } else {
      this.forecasts.push(new Forecast(category, month, year, sum, ""));
      return api.forecast.create({
        category_id: category.id,
        month,
        year,
        sum,
      });
    }
  }

  async changeForecastComment(
    category: Category,
    month: number,
    year: number,
    comment: string
  ): Promise<Response> {
    const forecast = this.forecasts.find(
      (f) =>
        f.category.id === category.id && f.month === month && f.year === year
    );
    if (forecast) {
      forecast.comment = comment;
      return api.forecast.modify(
        { comment },
        { category_id: category.id, month, year }
      );
    } else {
      this.forecasts.push(new Forecast(category, month, year, 0, comment));
      return api.forecast.create({
        category_id: category.id,
        month,
        year,
        sum: 0,
        comment,
      });
    }
  }

  async transferPersonalExpense(
    categoryId: PersonalExpCategoryIds,
    month: number,
    year: number
  ): Promise<Response | undefined> {
    const peSumInLs = localStorage.getItem(PE_SUM_LS_KEY);
    const peSum = peSumInLs ? parseInt(peSumInLs) : PE_SUM_DEFAULT;
    const category = categories.getById(categoryId);
    const { month: prevMonth, year: prevYear } = getPreviousMonth(month, year);
    const prevMonthForecast = this.find(prevYear, prevMonth, category);
    if (!prevMonthForecast) {
      alert("Сначала заполните прогноз за прошлый месяц!");
      return;
    }
    const prevMonthSpends = roundCost(
      lodashSum(
        expenseStore.expenses
          .filter(
            (e) =>
              e.date.month() === prevMonth &&
              e.date.year() === prevYear &&
              e.category.id === categoryId
          )
          .map((e) => e.cost)
      )
    );

    const sum = roundCost(prevMonthForecast.sum - prevMonthSpends + peSum);
    return this.changeForecastSum(category, month, year, sum);
  }
}

const forecastStore = new ForecastStore();

export default forecastStore;
