import { IAggFuncParams } from "ag-grid-enterprise";
import { CostCol } from "../../../models/Expense";
import categories from "../../../readonlyStores/categories";
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
  const value = roundCost(
    values.reduce((a, c) => (c.isUpcomingSubscription ? a : a + c.value), 0)
  );
  const { categoryId } = params.rowNode.childrenAfterGroup[0].data;
  const {
    isIncome,
    isContinuous,
    fromSavings: isSavingSpending,
  } = categories.getById(categoryId);
  const forecast = isSavingSpending
    ? params.context.savingSpendingsForecast
    : params.context.categoriesForecast?.[categoryId];
  const diff = forecast ? roundCost(forecast - value) : -value;
  // TODO count diff differently for saving spendings

  return {
    value,
    diff,
    isIncome,
    isContinuous,
  };
}
