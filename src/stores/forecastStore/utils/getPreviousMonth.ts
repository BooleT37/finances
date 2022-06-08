export default function getPreviousMonth(month: number) {
  return month === 0 ? 11 : month - 1
}