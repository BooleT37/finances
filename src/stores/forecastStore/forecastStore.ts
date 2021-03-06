import { action, makeObservable, observable } from "mobx";
import lodashSum from "lodash/sum";
import Forecast from "../../models/Forecast";
import categories from "../../readonlyStores/categories";
import expenseStore from "../expenseStore";
import { computedFn } from "mobx-utils";
import Category from "../../models/Category";
import { getPreviousMonth, avgForNonEmpty } from "./utils";
import { countUniqueMonths, roundCost } from "../../utils";
import { PersonalExpCategoryIds } from "../../utils/constants";
import sum from "lodash/sum";
import { ForecastTableItem } from "./types";
import {
  MONTH_DATE_FORMAT,
  PE_SUM_DEFAULT,
  PE_SUM_LS_KEY,
} from "../../constants";

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
    (
      year: number,
      month: number,
      isIncome: boolean,
      isPersonal: boolean
    ): ForecastTableItem[] => {
      const filtered = this.forecasts.filter((forecast) => {
        return (
          forecast.month === month &&
          forecast.year === year &&
          forecast.category.isIncome === isIncome &&
          forecast.category.isPersonal === isPersonal
        );
      });
      const filteredCategories = isIncome
        ? categories.getAllIncome()
        : categories.getAllExpenses(isPersonal);
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

        return {
          category: forecast.category.name,
          categoryId: forecast.category.id,
          average: avgForNonEmpty(
            Object.values(
              expenseStore.expenses
                .filter((e) => e.category.id === forecast.category.id)
                .reduce<Record<string, number>>((a, c) => {
                  const month = c.date.format(MONTH_DATE_FORMAT);
                  if (a[month]) {
                    a[month] += c.cost || 0;
                  } else {
                    a[month] = c.cost || 0;
                  }
                  return a;
                }, {})
            )
          ),
          monthsWithSpendings: `${countUniqueMonths(
            expenseStore.expenses
              .filter((e) => e.category.id === forecast.category.id)
              .map((e) => e.date)
          )} / ${expenseStore.totalMonths} ??????????????`,
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

      if (!isPersonal) {
        data.push({
          average: roundCost(sum(data.map((d) => d.average))),
          monthsWithSpendings: "",
          category: "??????????",
          categoryId: -1,
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
            forecast.category.isPersonal === isPersonal
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
    const peSumInLs = localStorage.getItem(PE_SUM_LS_KEY);
    const peSum = peSumInLs ? parseInt(peSumInLs) : PE_SUM_DEFAULT;
    const category = categories.getById(categoryId);
    const { month: prevMonth, year: prevYear } = getPreviousMonth(month, year);
    const prevMonthForecast = this.find(prevYear, prevMonth, category);
    if (!prevMonthForecast) {
      alert("?????????????? ?????????????????? ?????????????? ???? ?????????????? ??????????!");
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
