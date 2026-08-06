import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';

import { matchesCostQuery } from './matchesCostQuery';

const d = (n: number) => new Decimal(n);

describe('matchesCostQuery', () => {
  it('returns false for an empty query', () => {
    expect(matchesCostQuery(d(-50), '')).toBe(false);
    expect(matchesCostQuery(d(-50), '   ')).toBe(false);
  });

  it('matches an expense cost by its absolute value, ignoring sign', () => {
    expect(matchesCostQuery(d(-50), '50')).toBe(true);
  });

  it('matches an income cost with a leading minus in the query', () => {
    expect(matchesCostQuery(d(50), '-50')).toBe(true);
  });

  it('matches as a prefix of the absolute cost', () => {
    expect(matchesCostQuery(d(-50.5), '50')).toBe(true);
    expect(matchesCostQuery(d(1234.56), '123')).toBe(true);
  });

  it('does not match when the query is not a prefix or exact value', () => {
    expect(matchesCostQuery(d(-50), '51')).toBe(false);
    expect(matchesCostQuery(d(-50), '5.1')).toBe(false);
  });

  it('matches an exact decimal value even when not a string-prefix match', () => {
    // "5" is not a prefix of "50.00", but 50 === 50 once parsed
    expect(matchesCostQuery(d(50), '50.00')).toBe(true);
  });

  it('returns false for an unparseable query', () => {
    expect(matchesCostQuery(d(-50), 'abc')).toBe(false);
  });

  it('matches a zero cost with a zero query', () => {
    expect(matchesCostQuery(d(0), '0')).toBe(true);
  });
});
