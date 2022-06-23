import { CostCol } from "../../../models/Expense";
import { AggCostCol } from "../../models";

export default function isAggCostCol(costCol: CostCol | AggCostCol): costCol is AggCostCol {
  return 'diff' in costCol
}
