export default function sum(arr: (number | null)[]): number {
  return arr.reduce<number>((a, c) => a + (c || 0), 0)
}