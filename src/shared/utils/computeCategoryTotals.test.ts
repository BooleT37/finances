import Decimal from 'decimal.js';

import type { Category } from '~/features/categories/schema';

import { computeCategoryTotals } from './computeCategoryTotals';

const d = (n: string) => new Decimal(n);

function makeComp(cost: string, catId: number, subId: number | null = null) {
  return { cost: d(cost), categoryId: catId, subcategoryId: subId };
}

function makeTx(
  cost: string,
  catId: number,
  subId: number | null = null,
  comps: ReturnType<typeof makeComp>[] = [],
) {
  return {
    cost: d(cost),
    categoryId: catId,
    subcategoryId: subId,
    components: comps,
  };
}

function makeCat({
  id,
  isIncome,
  subcategoryIds = [],
  type = null,
}: {
  id: number;
  isIncome: boolean;
  subcategoryIds?: number[];
  type?: Category['type'];
}): Category {
  return {
    id,
    name: '',
    shortname: '',
    type,
    isIncome,
    isContinuous: false,
    icon: null,
    subcategories: subcategoryIds.map((subId) => ({ id: subId, name: '' })),
  };
}

const expenseCat = makeCat({ id: 1, isIncome: false });
const incomeCat = makeCat({ id: 2, isIncome: true });
const subCat = makeCat({ id: 3, isIncome: false, subcategoryIds: [10, 11] });

describe('computeCategoryTotals', () => {
  describe('empty state', () => {
    it('no transactions, no categories → empty maps', () => {
      const { categoryTotal } = computeCategoryTotals([], []);
      expect(categoryTotal.size).toBe(0);
    });

    it('no transactions, categories present → category totals are 0', () => {
      const { categoryTotal } = computeCategoryTotals(
        [],
        [expenseCat, incomeCat],
      );
      expect(categoryTotal.get(1)?.equals(d('0'))).toBe(true);
      expect(categoryTotal.get(2)?.equals(d('0'))).toBe(true);
    });
  });

  describe('category without subcategories', () => {
    it('single tx → categoryTotal reflects it', () => {
      const { categoryTotal } = computeCategoryTotals(
        [makeTx('-80', 1)],
        [expenseCat],
      );
      expect(categoryTotal.get(1)?.equals(d('-80'))).toBe(true);
    });

    it('multiple transactions in same category → sums correctly', () => {
      const { categoryTotal } = computeCategoryTotals(
        [makeTx('-50', 1), makeTx('-30', 1)],
        [expenseCat],
      );
      expect(categoryTotal.get(1)?.equals(d('-80'))).toBe(true);
    });

    it('unknown category id → not present in map', () => {
      const { categoryTotal } = computeCategoryTotals(
        [makeTx('-80', 1)],
        [expenseCat],
      );
      expect(categoryTotal.get(999)).toBeUndefined();
    });
  });

  describe('category with subcategories', () => {
    it('tx with subId=10 → subcategoryTotal(3-10) = tx.cost', () => {
      const { subcategoryTotal } = computeCategoryTotals(
        [makeTx('-40', 3, 10)],
        [subCat],
      );
      expect(subcategoryTotal.get('3-10')?.equals(d('-40'))).toBe(true);
      expect(subcategoryTotal.get('3-11')?.equals(d('0'))).toBe(true);
    });

    it('tx with subId=null on subCat category → restTotal = rest row', () => {
      const { restTotal } = computeCategoryTotals(
        [makeTx('-25', 3, null)],
        [subCat],
      );
      expect(restTotal.get(3)?.equals(d('-25'))).toBe(true);
    });

    it('both sub and rest txs → categoryTotal = sub total + rest total', () => {
      const txs = [
        makeTx('-40', 3, 10),
        makeTx('-30', 3, 11),
        makeTx('-20', 3, null),
      ];
      const { categoryTotal, subcategoryTotal, restTotal } =
        computeCategoryTotals(txs, [subCat]);
      expect(subcategoryTotal.get('3-10')?.equals(d('-40'))).toBe(true);
      expect(subcategoryTotal.get('3-11')?.equals(d('-30'))).toBe(true);
      expect(restTotal.get(3)?.equals(d('-20'))).toBe(true);
      expect(categoryTotal.get(3)?.equals(d('-90'))).toBe(true);
    });

    it('unknown subcategory → not present in map', () => {
      const { subcategoryTotal } = computeCategoryTotals(
        [makeTx('-40', 3, 10)],
        [subCat],
      );
      expect(subcategoryTotal.get('3-99')).toBeUndefined();
    });

    it('leaf category (no subcategories) → no rest row created', () => {
      const { restTotal } = computeCategoryTotals(
        [makeTx('-80', 1)],
        [expenseCat],
      );
      expect(restTotal.get(1)).toBeUndefined();
    });
  });

  describe('transaction components', () => {
    it('component same category/sub → remainder + component = tx.cost', () => {
      // tx cost=-100 attributed to cat=1; component cost=-30 also to cat=1
      // txPart = -100 - (-30) = -70; compPart = -30; total = -100
      const comp = makeComp('-30', 1);
      const { categoryTotal } = computeCategoryTotals(
        [makeTx('-100', 1, null, [comp])],
        [expenseCat],
      );
      expect(categoryTotal.get(1)?.equals(d('-100'))).toBe(true);
    });

    it('component pointing to different category → splits correctly, no double-counting', () => {
      // tx cost=-100 cat=1; component cost=-30 cat=3 subId=10
      // cat=1 gets: -100 - (-30) = -70 (remainder)
      // cat=3 sub=10 gets: -30 (component)
      const comp = makeComp('-30', 3, 10);
      const { categoryTotal, subcategoryTotal } = computeCategoryTotals(
        [makeTx('-100', 1, null, [comp])],
        [expenseCat, subCat],
      );
      expect(categoryTotal.get(1)?.equals(d('-70'))).toBe(true);
      expect(subcategoryTotal.get('3-10')?.equals(d('-30'))).toBe(true);
      expect(categoryTotal.get(3)?.equals(d('-30'))).toBe(true);
      // total across categories still equals the original tx cost
      expect(
        categoryTotal.get(1)!.plus(categoryTotal.get(3)!).equals(d('-100')),
      ).toBe(true);
    });

    it('component pointing to different subcategory within same category', () => {
      // tx cost=-100 cat=3 sub=null; component cost=-40 cat=3 sub=11
      // rest gets: -100 - (-40) = -60; sub=11 gets: -40; category total = -100
      const comp = makeComp('-40', 3, 11);
      const { categoryTotal, subcategoryTotal, restTotal } =
        computeCategoryTotals([makeTx('-100', 3, null, [comp])], [subCat]);
      expect(restTotal.get(3)?.equals(d('-60'))).toBe(true);
      expect(subcategoryTotal.get('3-11')?.equals(d('-40'))).toBe(true);
      expect(categoryTotal.get(3)?.equals(d('-100'))).toBe(true);
    });
  });

  describe('multiple categories mixed', () => {
    it('multiple categories → each total computed independently', () => {
      const cat4 = makeCat({ id: 4, isIncome: false });
      const { categoryTotal } = computeCategoryTotals(
        [makeTx('-80', 1), makeTx('-120', 4), makeTx('150', 2)],
        [expenseCat, incomeCat, cat4],
      );
      expect(categoryTotal.get(1)?.equals(d('-80'))).toBe(true);
      expect(categoryTotal.get(4)?.equals(d('-120'))).toBe(true);
      expect(categoryTotal.get(2)?.equals(d('150'))).toBe(true);
    });
  });
});
