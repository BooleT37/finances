import { CostCol } from "../../models/Expense";

export default interface AggCostCol extends CostCol {
  diff: number | null,
  isIncome: boolean,
  isContinuous: boolean,
}