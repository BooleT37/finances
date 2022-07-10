import { action, makeObservable, observable } from "mobx";
import Forecast from "../../models/Forecast";
import categories from "../../readonlyStores/categories";
import expenseStore from "../expenseStore";
import { computedFn } from "mobx-utils";
import Category from "../../models/Category";
import {
  getPreviousMonth,
  avgForNonEmpty,
  sortForecastsForView,
} from "./utils";
import { countUniqueMonths, roundCost } from "../../utils";
import { PersonalExpCategoryIds } from "../../utils/constants";
import sum from "lodash/sum";
import { ForecastTableItem } from "./types";

interface ForecastJson {
  category_id: number;
  month: number;
  year: number;
  sum: number;
  comment?: string;
}

class ForecastStore {
  public forecasts = observable.array<Forecast>();

  constructor() {
    makeObservable(this, {
      forecasts: observable,
      find: false,
      tableData: false,
      categoriesForecast: false,
      fromJson: action,
      changeForecastSum: action,
      changeForecastComment: action,
      transferPersonalExpense: action,
      totalForMonth: false,
    });
  }

  find(year: number, month: number, category: Category) {
    return this.forecasts.find(
      (f) =>
        f.year === year && f.month === month && f.category.id === category.id
    );
  }

  tableData = computedFn(
    (year: number, month: number, isIncome: boolean): ForecastTableItem[] => {
      const filtered = this.forecasts.filter(
        (forecast) =>
          forecast.month === month &&
          forecast.year === year &&
          forecast.category.isIncome === isIncome
      );
      const filteredCategories = isIncome
        ? categories.getAllIncome()
        : categories.getAllExpenses();
      filteredCategories.forEach((category) => {
        if (filtered.every((f) => f.category.id !== category.id)) {
          filtered.push(new Forecast(category, month, year, 0));
        }
      });
      sortForecastsForView(filtered);
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

        return {
          category: forecast.category.name,
          average: avgForNonEmpty(
            expenseStore.expenses
              .filter((e) => e.category.id === forecast.category.id)
              .map((e) => e.cost || 0)
          ),
          monthsWithSpendings: `${countUniqueMonths(
            expenseStore.expenses
              .filter((e) => e.category.id === forecast.category.id)
              .map((e) => e.date)
          )} / ${expenseStore.totalMonths} месяцев`,
          lastMonth: {
            spendings: lastMonthSpendings,
            diff:
              roundCost(lastMonthForecast - lastMonthSpendings) *
              (isIncome ? -1 : 1),
          },
          thisMonth: {
            spendings: thisMonthSpendings,
            diff:
              roundCost(forecast.sum - thisMonthSpendings) *
              (isIncome ? -1 : 1),
          },
          sum: forecast.sum,
          comment: forecast.comment || "",
        };
      });

      data.push({
        average: roundCost(sum(data.map((d) => d.average))),
        monthsWithSpendings: "",
        category: "Всего",
        comment: "",
        lastMonth: {
          spendings: roundCost(sum(data.map((d) => d.lastMonth.spendings))),
          diff: roundCost(sum(data.map((d) => d.lastMonth.diff))),
        },
        sum: roundCost(sum(data.map((d) => d.sum))),
        thisMonth: {
          spendings: roundCost(sum(data.map((d) => d.thisMonth.spendings))),
          diff: roundCost(sum(data.map((d) => d.thisMonth.diff))),
        },
      });

      return data;
    }
  );

  totalForMonth(year: number, month: number, isIncome: boolean) {
    return sum(
      this.forecasts
        .filter(
          (forecast) =>
            forecast.month === month &&
            forecast.year === year &&
            forecast.category.isIncome === isIncome
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
      return fetch(
        `${process.env.REACT_APP_API_URL}/forecast?category_id=${category.id}&month=${month}&year=${year}`,
        {
          method: "PATCH",
          body: JSON.stringify({ sum }),
          headers: {
            "content-type": "application/json",
          },
        }
      );
    } else {
      this.forecasts.push(new Forecast(category, month, year, sum, ""));
      return fetch(`${process.env.REACT_APP_API_URL}/forecast`, {
        method: "POST",
        body: JSON.stringify({
          category_id: category.id,
          month,
          year,
          sum,
        }),
        headers: {
          "content-type": "application/json",
        },
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
      return fetch(
        `${process.env.REACT_APP_API_URL}/forecast?category_id=${category.id}&month=${month}&year=${year}`,
        {
          method: "PATCH",
          body: JSON.stringify({ comment }),
          headers: {
            "content-type": "application/json",
          },
        }
      );
    } else {
      this.forecasts.push(new Forecast(category, month, year, 0, comment));
      return fetch(`${process.env.REACT_APP_API_URL}/forecast`, {
        method: "POST",
        body: JSON.stringify({
          category_id: category.id,
          month,
          year,
          sum: 0,
          comment,
        }),
        headers: {
          "content-type": "application/json",
        },
      });
    }
  }

  async transferPersonalExpense(
    categoryId: PersonalExpCategoryIds,
    month: number,
    year: number
  ): Promise<Response | undefined> {
    const category = categories.getById(categoryId);
    const { month: prevMonth, year: prevYear } = getPreviousMonth(month, year);
    const prevMonthForecast = this.find(prevYear, prevMonth, category);
    const thisMonthSum = this.find(year, month, category)?.sum ?? 0;
    if (!prevMonthForecast) {
      alert("Сначала заполните прогноз за прошлый месяц!");
      return;
    }
    const prevMonthSpends = roundCost(
      expenseStore.expenses
        .filter(
          (e) =>
            e.date.month() === prevMonth &&
            e.date.year() === prevYear &&
            e.category.id === categoryId
        )
        .reduce((a, c) => a + (c.cost || 0), 0)
    );

    const sum = roundCost(
      prevMonthForecast.sum - prevMonthSpends + thisMonthSum
    );
    return this.changeForecastSum(category, month, year, sum);
  }
}

const forecastStore = new ForecastStore();

export default forecastStore;
