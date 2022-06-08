export default function roundCost(cost: number): number {
  return Math.trunc(cost * 100) / 100
}