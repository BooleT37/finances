import { Moment } from "moment";
import sum from "./sum";

export default function countUniqueMonths(dates: Moment[]): number {
  const map: Record<number, Set<number>> = {}

  dates.forEach(date => {
    const year = date.year()
    const month = date.month()
    if (!map[year]) {
      map[year] = new Set<number>([month])
    } else {
      map[year].add(month)
    }
  })
  return sum(Object.values(map).map(months => months.size))
}