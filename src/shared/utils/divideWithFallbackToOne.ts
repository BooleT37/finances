export function divideWithFallbackToOne(
  dividend: number,
  divisor: number,
): number {
  return divisor === 0 ? 1 : dividend / divisor;
}
