import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';

import { costWithoutComponents } from './costWithoutComponents';

const d = (n: number) => new Decimal(n);

describe('costWithoutComponents', () => {
  it('returns cost unchanged when there are no components', () => {
    expect(costWithoutComponents(d(-50), [])).toEqual(d(-50));
  });

  it('subtracts a single expense component from an expense cost', () => {
    expect(costWithoutComponents(d(-50), [{ cost: d(-20) }])).toEqual(d(-30));
  });

  it('subtracts multiple expense components from an expense cost', () => {
    expect(
      costWithoutComponents(d(-100), [{ cost: d(-30) }, { cost: d(-40) }]),
    ).toEqual(d(-30));
  });

  it('returns zero when components sum equals cost', () => {
    expect(
      costWithoutComponents(d(-50), [{ cost: d(-30) }, { cost: d(-20) }]),
    ).toEqual(d(0));
  });

  it('returns a positive value when expense components sum exceeds expense cost', () => {
    expect(
      costWithoutComponents(d(-50), [{ cost: d(-30) }, { cost: d(-30) }]),
    ).toEqual(d(10));
  });

  it('subtracts an expense component from an income cost', () => {
    // income transaction split with an expense component increases the remainder
    expect(costWithoutComponents(d(200), [{ cost: d(-30) }])).toEqual(d(230));
  });

  it('subtracts an income component from an expense cost', () => {
    // expense transaction with an income component reduces the remainder further
    expect(costWithoutComponents(d(-100), [{ cost: d(50) }])).toEqual(d(-150));
  });

  it('handles mixed-sign components', () => {
    // expense transaction with one expense component (-30) and one income component (+20)
    // net = -100 - (-30 + 20) = -100 - (-10) = -90
    expect(
      costWithoutComponents(d(-100), [{ cost: d(-30) }, { cost: d(20) }]),
    ).toEqual(d(-90));
  });
});
