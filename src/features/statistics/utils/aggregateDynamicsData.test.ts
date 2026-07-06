import dayjs from 'dayjs';
import Decimal from 'decimal.js';

import type { Category } from '~/features/categories/schema';

import type { DatedTx } from './aggregateComparisonData';
import { aggregateDynamicsData } from './aggregateDynamicsData';

const d = (n: string) => new Decimal(n);

function makeComp(cost: string, catId: number) {
  return { cost: d(cost), categoryId: catId, subcategoryId: null };
}

function makeTx(
  date: string,
  cost: string,
  catId: number,
  comps: ReturnType<typeof makeComp>[] = [],
): DatedTx {
  return {
    date: dayjs(date),
    cost: d(cost),
    categoryId: catId,
    subcategoryId: null,
    components: comps,
  };
}

function makeCat({ id }: { id: number }): Category {
  return {
    id,
    name: '',
    shortname: '',
    type: null,
    isIncome: false,
    isContinuous: false,
    icon: null,
    subcategories: [],
  };
}

const cat1 = makeCat({ id: 1 });
const cat2 = makeCat({ id: 2 });

describe('aggregateDynamicsData', () => {
  it('zero-fills months with no transactions in the range', () => {
    const result = aggregateDynamicsData(
      [makeTx('2026-01-15', '-100', 1)],
      [cat1],
      dayjs('2026-01-01'),
      dayjs('2026-03-01'),
      [1],
    );
    expect(result).toEqual([
      { month: '2026-01', '1': 100 },
      { month: '2026-02', '1': 0 },
      { month: '2026-03', '1': 0 },
    ]);
  });

  it('buckets transactions by month correctly', () => {
    const result = aggregateDynamicsData(
      [
        makeTx('2026-01-05', '-10', 1),
        makeTx('2026-01-25', '-20', 1),
        makeTx('2026-02-10', '-30', 1),
      ],
      [cat1],
      dayjs('2026-01-01'),
      dayjs('2026-02-28'),
      [1],
    );
    expect(result).toEqual([
      { month: '2026-01', '1': 30 },
      { month: '2026-02', '1': 30 },
    ]);
  });

  it('categoryIds provided → only those categories appear, others ignored', () => {
    const result = aggregateDynamicsData(
      [makeTx('2026-01-10', '-100', 1), makeTx('2026-01-10', '-50', 2)],
      [cat1, cat2],
      dayjs('2026-01-01'),
      dayjs('2026-01-31'),
      [1],
    );
    expect(result).toEqual([{ month: '2026-01', '1': 100 }]);
  });

  it('categoryIds empty → includes every category present in the transactions', () => {
    const result = aggregateDynamicsData(
      [makeTx('2026-01-10', '-100', 1), makeTx('2026-01-10', '-50', 2)],
      [cat1, cat2],
      dayjs('2026-01-01'),
      dayjs('2026-01-31'),
      [],
    );
    expect(result).toEqual([{ month: '2026-01', '1': 100, '2': 50 }]);
  });

  it('categoryIds empty → includes a category that only appears as a component', () => {
    const comp = makeComp('-30', 2);
    const result = aggregateDynamicsData(
      [makeTx('2026-01-10', '-100', 1, [comp])],
      [cat1, cat2],
      dayjs('2026-01-01'),
      dayjs('2026-01-31'),
      [],
    );
    expect(result).toEqual([{ month: '2026-01', '1': 70, '2': 30 }]);
  });

  it('single-month range (from === to month) → one row', () => {
    const result = aggregateDynamicsData(
      [makeTx('2026-01-15', '-100', 1)],
      [cat1],
      dayjs('2026-01-01'),
      dayjs('2026-01-31'),
      [1],
    );
    expect(result).toEqual([{ month: '2026-01', '1': 100 }]);
  });

  it('returns absolute magnitudes', () => {
    const result = aggregateDynamicsData(
      [makeTx('2026-01-15', '100', 1)],
      [cat1],
      dayjs('2026-01-01'),
      dayjs('2026-01-31'),
      [1],
    );
    expect(result).toEqual([{ month: '2026-01', '1': 100 }]);
  });

  it('no categories and no categoryIds → month rows with no category keys', () => {
    const result = aggregateDynamicsData(
      [],
      [],
      dayjs('2026-01-01'),
      dayjs('2026-01-31'),
      [],
    );
    expect(result).toEqual([{ month: '2026-01' }]);
  });
});
