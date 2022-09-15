import { IAggFuncParams } from "ag-grid-enterprise";
import categories from "../../../readonlyStores/categories";
import { CostCol } from "../../../models/Expense";
import { roundCost } from "../../../utils";
import { AggCostCol } from "../../models";

export default function costAggFunc(params: IAggFuncParams): AggCostCol {
  const values: CostCol[] = params.values;
  if (values.length === 0 || !params.rowNode.childrenAfterGroup?.[0].data) {
    return {
      value: 0,
      diff: null,
      isIncome: false,
      isContinuous: false,
    };
  }
  const value = roundCost(values.reduce((a, c) => a + c.value, 0));
  const { categoryId } = params.rowNode.childrenAfterGroup[0].data;
  const { isIncome, isContinuous } = categories.getById(categoryId);
  const forecast = params.context.categoriesForecast?.[categoryId];
  const diff = forecast ? roundCost(forecast - value) : -value;

  return {
    value,
    diff,
    isIncome,
    isContinuous,
  };
}
