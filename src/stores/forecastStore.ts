import { action, makeObservable, observable } from "mobx";
import Forecast from "../models/Forecast";
import categoryStore from "./categoryStore";
import expenseStore from "./expenseStore";
import { computedFn } from 'mobx-utils'
import Category from "../models/Category";

interface ForecastTableItem {
  category: string,
  average: number,
  lastMonth: number,
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

function getPreviousMonth(month: number) {
  return month === 0 ? 11 : month - 1
}

class ForecastStore {
  public forecasts: Forecast[]

  constructor() {
    makeObservable(this, {
      forecasts: observable,
      tableData: false,
      fromJson: action,
      changeForecastSum: action,
      changeForecastComment: action
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
    return filtered.map(forecast => ({
      category: forecast.category.name,
      average: expenseStore.expenses
        .filter(e => e.date.month() === forecast.month)
        .reduce((a, c) => a + (c.cost || 0), 0),
      lastMonth: this.forecasts.find(
        ({ category, month }) => category === forecast.category
          && month === getPreviousMonth(forecast.month)
      )?.sum ?? 0,
      sum: forecast.sum,
      comment: forecast.comment || ''
    }))
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

  changeForecastSum(category: Category, month: number, year: number, sum: number) {
    const foundIndex = this.forecasts.findIndex(
      f => f.category.id === category.id && f.month === month && f.year === year
    )
    if (foundIndex !== -1) {
      this.forecasts[foundIndex].sum = sum
    } else {
      this.forecasts.push(new Forecast(category, month, year, sum, ''))
    }
  }

  changeForecastComment(category: Category, month: number, year: number, comment: string) {
    const foundIndex = this.forecasts.findIndex(
      f => f.category.id === category.id && f.month === month && f.year === year
    )
    if (foundIndex !== -1) {
      this.forecasts[foundIndex].comment = comment
    } else {
      this.forecasts.push(new Forecast(category, month, year, 0, comment))
    }
  }
}

const forecastStore = new ForecastStore()

export default forecastStore
