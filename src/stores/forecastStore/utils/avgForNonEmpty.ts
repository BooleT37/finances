import { roundCost } from "../../../utils";
import sum from "lodash/sum";
import isNil from "lodash/isNil";

export default function avgForNonEmpty(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const filtered = values.filter((value) => !isNil(value));

  return roundCost(sum(filtered) / filtered.length);
}
