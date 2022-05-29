import { action, makeObservable, observable } from "mobx";
import Forecast from "../models/Forecast";
import categoryStore from "./categoryStore";
import expenseStore from "./expenseStore";
import { computedFn } from 'mobx-utils'

interface ForecastTableItem {
  category: string,
  average: number,
  lastMonth: number,
  sum: number,
  comment: string,
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
      fromFakeData: action
    })
  }

  tableData = computedFn((year: number, month: number): ForecastTableItem[] => {
    return this.forecasts
      .filter(forecast => forecast.month === month && forecast.year === year)
      .map(forecast => ({
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

  fromFakeData() {
    this.forecasts = getFakeForecasts()
  }
}

const getFakeForecasts = (): Forecast[] => [
  new Forecast(categoryStore.getByName('Подписки'), 5, 2022, 50),
  new Forecast(categoryStore.getByName('Рестораны'), 5, 2022, 400),
  new Forecast(categoryStore.getByName('Аренда'), 5, 2022, 1100),
  new Forecast(categoryStore.getByName('Рестораны'), 4, 2022, 350),
  new Forecast(categoryStore.getByName('Аренда'), 4, 2022, 1100),
]

const forecastStore = new ForecastStore()

export default forecastStore
