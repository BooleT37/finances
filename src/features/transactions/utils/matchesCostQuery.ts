import Decimal from 'decimal.js';

/**
 * Matches a cost against a free-text query using the same sign-insensitive
 * convention as the transactions table's cost column filter (see
 * `costFilterFn.ts`): a leading "-" is ignored, and the query matches either
 * as a prefix of the absolute cost (e.g. "50" matches 50.5) or as an exact
 * value once parsed as a number.
 *
 * Unlike `costFilterFn`, an unparseable query returns `false` rather than
 * matching everything — this function is meant to be OR-ed with a name
 * search, where "match everything" would defeat the name filter.
 */
export function matchesCostQuery(cost: Decimal, rawQuery: string): boolean {
  const raw = rawQuery.trim();
  if (!raw) {
    return false;
  }
  const normalizedRaw = raw.replace(/^-/, '');
  if (cost.abs().toFixed(2).startsWith(normalizedRaw)) {
    return true;
  }
  let target: Decimal;
  try {
    target = new Decimal(raw);
  } catch {
    return false;
  }
  return cost.abs().equals(target.abs());
}
