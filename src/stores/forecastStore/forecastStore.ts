import { action, flow, makeObservable, observable } from "mobx";
import Forecast from "../../models/Forecast";
import categoryStore from "../categoryStore";
import expenseStore from "../expenseStore";
import { computedFn } from 'mobx-utils'
import Category from "../../models/Category";
import { getPreviousMonth, avgForNonEmpty } from "./utils";
import { countUniqueMonths, roundCost, sum } from "../../utils";

interface ForecastTableItem {
  category: string,
  isIncome: boolean,
  average: number,
  monthsWithSpendings: string,
  lastMonth: number,
  thisMonth: number,
  sum: number,
  comment: string,
}

interface ForecastJson {
  category_id: number,
  month: number,
  year: number,
  sum: number,
  comment?: string
}

class ForecastStore {
  public forecasts: Forecast[]

  constructor() {
    makeObservable(this, {
      forecasts: observable,
      tableData: false,
      categoriesForecast: false,
      fromJson: action,
      changeForecastSum: flow.bound,
      changeForecastComment: flow.bound
    })
  }

  tableData = computedFn((year: number, month: number): ForecastTableItem[] => {
    const filtered = this.forecasts
      .filter(forecast => forecast.month === month && forecast.year === year)
    categoryStore.categories.forEach(category => {
      if (filtered.every(f => f.category.id !== category.id)) {
        filtered.push(new Forecast(category, month, year, 0))
      }
    })
    filtered.sort((f1, f2) => f1.category.id - f2.category.id)
    const data = filtered.map(forecast => ({
      category: forecast.category.name,
      isIncome: forecast.category.isIncome,
      average: avgForNonEmpty(expenseStore.expenses
        .filter(e => e.category.id === forecast.category.id)
        .map(e => e.cost || 0)),
      monthsWithSpendings: `${countUniqueMonths(expenseStore.expenses
        .filter(e => e.category.id === forecast.category.id)
        .map(e => e.date))} / ${expenseStore.totalMonths} месяцев`,
      lastMonth: this.forecasts.find(
        ({ category, month }) => category === forecast.category
          && month === getPreviousMonth(forecast.month)
      )?.sum ?? 0,
      thisMonth: roundCost(expenseStore.expenses
        .filter(e => e.date.month() === month && e.date.year() === year && e.category.id === forecast.category.id)
        .reduce((a, c) => a + (c.cost || 0), 0)),
      sum: forecast.sum,
      comment: forecast.comment || ''
    }))

    data.push({
      average: roundCost(sum(data.map(d => d.isIncome ? -d.average : d.average))),
      monthsWithSpendings: '',
      category: 'Всего',
      isIncome: false,
      comment: '',
      lastMonth: sum(data.map(d => d.isIncome ? -d.lastMonth : d.lastMonth)),
      sum: sum(data.map(d => d.isIncome ? -d.sum : d.sum)),
      thisMonth: sum(data.map(d => d.isIncome ? -d.thisMonth : d.thisMonth))
    })

    return data
  })

  categoriesForecast = computedFn((year: number, month: number): Record<number, number> => {
    return Object.fromEntries(
      this.forecasts
        .filter(f => f.month === month && f.year === year)
        .map(f => [f.category.id, f.sum])
    )
  })

  fromJson(json: ForecastJson[]) {
    this.forecasts = json.map(f => new Forecast(
      categoryStore.getById(f.category_id),
      f.month,
      f.year,
      f.sum,
      f.comment
    ))
  }

  *changeForecastSum(category: Category, month: number, year: number, sum: number): Generator<Promise<Response>> {
    const foundIndex = this.forecasts.findIndex(
      f => f.category.id === category.id && f.month === month && f.year === year
    )
    if (foundIndex !== -1) {
      this.forecasts[foundIndex].sum = sum
      yield fetch(
        `${process.env.REACT_APP_API_URL}/forecast?category_id=${category.id}&month=${month}&year=${year}`,
        {
          method: "PATCH", body: JSON.stringify({ sum }),
          headers: {
            "content-type": "application/json"
          }
        })
    } else {
      this.forecasts.push(new Forecast(category, month, year, sum, ''))
      yield fetch(
        `${process.env.REACT_APP_API_URL}/forecast`,
        {
          method: "POST", body: JSON.stringify({
            category_id: category.id,
            month,
            year,
            sum
          }),
          headers: {
            "content-type": "application/json"
          }
        })
    }
  }

  *changeForecastComment(category: Category, month: number, year: number, comment: string): Generator<Promise<Response>> {
    const foundIndex = this.forecasts.findIndex(
      f => f.category.id === category.id && f.month === month && f.year === year
    )
    if (foundIndex !== -1) {
      this.forecasts[foundIndex].comment = comment
      yield fetch(
        `${process.env.REACT_APP_API_URL}/forecast?category_id=${category.id}&month=${month}&year=${year}`,
        {
          method: "PATCH", body: JSON.stringify({ comment }),
          headers: {
            "content-type": "application/json"
          }
        })
    } else {
      this.forecasts.push(new Forecast(category, month, year, 0, comment))
      yield fetch(
        `${process.env.REACT_APP_API_URL}/forecast`,
        {
          method: "POST", body: JSON.stringify({
            category_id: category.id,
            month,
            year,
            sum: 0,
            comment
          }),
          headers: {
            "content-type": "application/json"
          }
        })
    }
  }
}

const forecastStore = new ForecastStore()

export default forecastStore
