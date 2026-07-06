import dayjs from 'dayjs';
import Decimal from 'decimal.js';

import type { Category } from '~/features/categories/schema';

import {
  aggregateComparisonData,
  type DatedTx,
} from './aggregateComparisonData';

const d = (n: string) => new Decimal(n);

function makeTx(
  date: string,
  cost: string,
  catId: number,
  subId: number | null = null,
): DatedTx {
  return {
    date: dayjs(date),
    cost: d(cost),
    categoryId: catId,
    subcategoryId: subId,
    components: [],
  };
}

function makeCat({
  id,
  isIncome = false,
}: {
  id: number;
  isIncome?: boolean;
}): Category {
  return {
    id,
    name: '',
    shortname: '',
    type: null,
    isIncome,
    isContinuous: false,
    icon: null,
    subcategories: [],
  };
}

const cat1 = makeCat({ id: 1 });
const cat2 = makeCat({ id: 2 });
const incomeCat = makeCat({ id: 3, isIncome: true });

const period1 = { start: dayjs('2026-01-01'), end: dayjs('2026-01-31') };
const period2 = { start: dayjs('2026-02-01'), end: dayjs('2026-02-28') };

describe('aggregateComparisonData', () => {
  it('splits transactions into period1/period2 by date', () => {
    const result = aggregateComparisonData(
      [makeTx('2026-01-15', '-100', 1), makeTx('2026-02-15', '-60', 1)],
      [cat1],
      period1,
      period2,
    );
    expect(result).toEqual([{ categoryId: 1, period1: 100, period2: 60 }]);
  });

  it('category with activity in only one period → other period is 0', () => {
    const result = aggregateComparisonData(
      [makeTx('2026-01-15', '-100', 1)],
      [cat1],
      period1,
      period2,
    );
    expect(result).toEqual([{ categoryId: 1, period1: 100, period2: 0 }]);
  });

  it('category with zero activity in both periods → omitted from result', () => {
    const result = aggregateComparisonData(
      [makeTx('2026-01-15', '-100', 1)],
      [cat1, cat2],
      period1,
      period2,
    );
    expect(result).toEqual([{ categoryId: 1, period1: 100, period2: 0 }]);
  });

  it('returns absolute magnitudes regardless of income/expense sign', () => {
    const result = aggregateComparisonData(
      [makeTx('2026-01-15', '500', 3), makeTx('2026-02-15', '300', 3)],
      [incomeCat],
      period1,
      period2,
    );
    expect(result).toEqual([{ categoryId: 3, period1: 500, period2: 300 }]);
  });

  it('period boundaries are inclusive', () => {
    const result = aggregateComparisonData(
      [
        makeTx('2026-01-01', '-10', 1),
        makeTx('2026-01-31', '-20', 1),
        makeTx('2026-02-28', '-30', 1),
      ],
      [cat1],
      period1,
      period2,
    );
    expect(result).toEqual([{ categoryId: 1, period1: 30, period2: 30 }]);
  });

  it('transaction outside both periods is excluded entirely', () => {
    const result = aggregateComparisonData(
      [makeTx('2026-03-15', '-100', 1)],
      [cat1],
      period1,
      period2,
    );
    expect(result).toEqual([]);
  });

  it('multiple categories, each computed independently', () => {
    const result = aggregateComparisonData(
      [
        makeTx('2026-01-10', '-100', 1),
        makeTx('2026-01-10', '-50', 2),
        makeTx('2026-02-10', '-80', 2),
      ],
      [cat1, cat2],
      period1,
      period2,
    );
    expect(result).toEqual([
      { categoryId: 1, period1: 100, period2: 0 },
      { categoryId: 2, period1: 50, period2: 80 },
    ]);
  });
});
