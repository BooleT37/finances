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
