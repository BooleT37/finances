import { roundCost } from "../../../utils"
import sum from "../../../utils/sum"

export default function avgForNonEmpty(values: number[]): number {
  if (values.length === 0) {
    return 0
  }
  const filtered = values.filter(value => !!value)

  return roundCost(sum(filtered) / filtered.length)
}