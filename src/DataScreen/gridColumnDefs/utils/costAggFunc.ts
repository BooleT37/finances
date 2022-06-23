import { IAggFuncParams } from "ag-grid-enterprise";
import Currency from "../../../models/Currency";
import { CostCol } from "../../../models/Expense";
import { roundCost } from "../../../utils";
import { AggCostCol } from "../../models";


export default function costAggFunc(params: IAggFuncParams): AggCostCol {
  const values: CostCol[] = params.values;
  const currency = Currency.Eur;
  if (values.length === 0) {
    return { value: 0, currency, diff: null, isIncome: false }
  }
  const value = roundCost(values.reduce((a, c) => a + c.value, 0));
  const forecast = params.context.categoriesForecast?.[values[0].categoryId]
  const diff = forecast ? roundCost(forecast - value) : -value

  return { value, currency, diff, isIncome: values[0].isIncome }
}