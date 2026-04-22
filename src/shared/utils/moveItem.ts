export function moveItem<T>(array: T[], item: T, moveAfter: T): T[] {
  const fromIndex = array.indexOf(item);
  const toIndex = array.indexOf(moveAfter);
  if (fromIndex === -1 || toIndex === -1) {
    return array;
  }
  const result = [...array];
  result.splice(fromIndex, 1);
  result.splice(toIndex, 0, item);
  return result;
}
