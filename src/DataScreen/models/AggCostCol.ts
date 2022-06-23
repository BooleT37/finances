import { CostCol } from "../../models/Expense";

export default interface AggCostCol extends Omit<CostCol, 'categoryId'> {
  diff: number | null
}