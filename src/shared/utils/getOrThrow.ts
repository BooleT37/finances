/**
 * Look up a value in a record by key, throwing if it doesn't exist.
 * Useful for indexed reference data where a missing key is a data integrity error.
 */
export function getOrThrow<T>(
  record: Record<string, T>,
  key: string | number,
  label?: string,
): T {
  const value = record[key];
  if (value === undefined) {
    throw new Error(
      `${label ?? 'Record'} has no entry for key "${String(key)}"`,
    );
  }
  return value;
}

/**
 * Find an item in an array by id, throwing if not found.
 * Useful for reference data where a missing item is a data integrity error.
 */
export function findByIdOrThrow<T extends { id: number }>(
  items: T[],
  id: number,
  label?: string,
): T {
  const value = items.find((item) => item.id === id);
  if (value === undefined) {
    throw new Error(`${label ?? 'Item'} with id ${id} not found`);
  }
  return value;
}
