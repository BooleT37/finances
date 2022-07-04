export default function getPreviousMonth(month: number, year: number): {month: number, year: number} {
  if (month === 0) {
    return {
      month: 11,
      year: year - 1
    }
  }
  return {
    month: month - 1,
    year
  }
}