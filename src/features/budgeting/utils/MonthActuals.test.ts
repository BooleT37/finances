import Decimal from 'decimal.js';

import type { Category } from '~/features/categories/schema';

import { MonthActuals } from './MonthActuals';

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
const savingsCat = makeCat({ id: 5, isIncome: false, type: 'TO_SAVINGS' });

describe('MonthActuals', () => {
  describe('empty state', () => {
    it('no transactions, no categories → all zeros', () => {
      const ma = new MonthActuals([], []);
      expect(ma.getTotalExpenses().equals(d('0'))).toBe(true);
      expect(ma.getTotalIncome().equals(d('0'))).toBe(true);
    });

    it('no transactions, categories present → category totals are 0', () => {
      const ma = new MonthActuals([], [expenseCat, incomeCat]);
      expect(ma.getCategoryTotal(1).equals(d('0'))).toBe(true);
      expect(ma.getCategoryTotal(2).equals(d('0'))).toBe(true);
    });
  });

  describe('category without subcategories', () => {
    it('single expense tx → getCategoryTotal and getTotalExpenses reflect it', () => {
      const ma = new MonthActuals([makeTx('-80', 1)], [expenseCat]);
      expect(ma.getCategoryTotal(1).equals(d('-80'))).toBe(true);
      expect(ma.getTotalExpenses().equals(d('-80'))).toBe(true);
      expect(ma.getTotalIncome().equals(d('0'))).toBe(true);
    });

    it('multiple transactions in same category → sums correctly', () => {
      const ma = new MonthActuals(
        [makeTx('-50', 1), makeTx('-30', 1)],
        [expenseCat],
      );
      expect(ma.getCategoryTotal(1).equals(d('-80'))).toBe(true);
      expect(ma.getTotalExpenses().equals(d('-80'))).toBe(true);
    });

    it('income category tx → getTotalIncome includes it, getTotalExpenses excludes it', () => {
      const ma = new MonthActuals([makeTx('200', 2)], [incomeCat]);
      expect(ma.getCategoryTotal(2).equals(d('200'))).toBe(true);
      expect(ma.getTotalIncome().equals(d('200'))).toBe(true);
      expect(ma.getTotalExpenses().equals(d('0'))).toBe(true);
    });

    it('getCategoryTotal for unknown id → 0', () => {
      const ma = new MonthActuals([makeTx('-80', 1)], [expenseCat]);
      expect(ma.getCategoryTotal(999).equals(d('0'))).toBe(true);
    });
  });

  describe('category with subcategories', () => {
    it('tx with subId=10 → getSubcategoryTotal(3, 10) = tx.cost', () => {
      const ma = new MonthActuals([makeTx('-40', 3, 10)], [subCat]);
      expect(ma.getSubcategoryTotal(3, 10).equals(d('-40'))).toBe(true);
      expect(ma.getSubcategoryTotal(3, 11).equals(d('0'))).toBe(true);
    });

    it('tx with subId=null on subCat category → getSubcategoryTotal(3, null) = rest row', () => {
      const ma = new MonthActuals([makeTx('-25', 3, null)], [subCat]);
      expect(ma.getSubcategoryTotal(3, null).equals(d('-25'))).toBe(true);
    });

    it('both sub and rest txs → getCategoryTotal = sub total + rest total', () => {
      const txs = [
        makeTx('-40', 3, 10),
        makeTx('-30', 3, 11),
        makeTx('-20', 3, null),
      ];
      const ma = new MonthActuals(txs, [subCat]);
      expect(ma.getSubcategoryTotal(3, 10).equals(d('-40'))).toBe(true);
      expect(ma.getSubcategoryTotal(3, 11).equals(d('-30'))).toBe(true);
      expect(ma.getSubcategoryTotal(3, null).equals(d('-20'))).toBe(true);
      expect(ma.getCategoryTotal(3).equals(d('-90'))).toBe(true);
    });

    it('getSubcategoryTotal for unknown subcategory → 0', () => {
      const ma = new MonthActuals([makeTx('-40', 3, 10)], [subCat]);
      expect(ma.getSubcategoryTotal(3, 99).equals(d('0'))).toBe(true);
    });

    it('getSubcategoryTotal(null) on leaf category → 0 (no rest row created)', () => {
      const ma = new MonthActuals([makeTx('-80', 1)], [expenseCat]);
      expect(ma.getSubcategoryTotal(1, null).equals(d('0'))).toBe(true);
    });
  });

  describe('transaction components', () => {
    it('component same category/sub → remainder + component = tx.cost', () => {
      // tx cost=-100 attributed to cat=1; component cost=-30 also to cat=1
      // txPart = -100 - (-30) = -70; compPart = -30; total = -100
      const comp = makeComp('-30', 1);
      const ma = new MonthActuals(
        [makeTx('-100', 1, null, [comp])],
        [expenseCat],
      );
      expect(ma.getCategoryTotal(1).equals(d('-100'))).toBe(true);
      expect(ma.getTotalExpenses().equals(d('-100'))).toBe(true);
    });

    it('component pointing to different category → splits correctly', () => {
      // tx cost=-100 cat=1; component cost=-30 cat=3 subId=10
      // cat=1 gets: -100 - (-30) = -70 (remainder)
      // cat=3 sub=10 gets: -30 (component)
      const comp = makeComp('-30', 3, 10);
      const ma = new MonthActuals(
        [makeTx('-100', 1, null, [comp])],
        [expenseCat, subCat],
      );
      expect(ma.getCategoryTotal(1).equals(d('-70'))).toBe(true);
      expect(ma.getSubcategoryTotal(3, 10).equals(d('-30'))).toBe(true);
      expect(ma.getCategoryTotal(3).equals(d('-30'))).toBe(true);
      expect(ma.getTotalExpenses().equals(d('-100'))).toBe(true);
    });

    it('component pointing to different subcategory within same category', () => {
      // tx cost=-100 cat=3 sub=null; component cost=-40 cat=3 sub=11
      // rest gets: -100 - (-40) = -60; sub=11 gets: -40; category total = -100
      const comp = makeComp('-40', 3, 11);
      const ma = new MonthActuals([makeTx('-100', 3, null, [comp])], [subCat]);
      expect(ma.getSubcategoryTotal(3, null).equals(d('-60'))).toBe(true);
      expect(ma.getSubcategoryTotal(3, 11).equals(d('-40'))).toBe(true);
      expect(ma.getCategoryTotal(3).equals(d('-100'))).toBe(true);
    });
  });

  describe('multiple categories mixed', () => {
    it('expense and income categories → totals separated correctly', () => {
      const txs = [makeTx('-80', 1), makeTx('150', 2)];
      const ma = new MonthActuals(txs, [expenseCat, incomeCat]);
      expect(ma.getTotalExpenses().equals(d('-80'))).toBe(true);
      expect(ma.getTotalIncome().equals(d('150'))).toBe(true);
    });

    it('multiple expense categories → getTotalExpenses = sum of all', () => {
      const cat4 = makeCat({ id: 4, isIncome: false });
      const txs = [makeTx('-80', 1), makeTx('-120', 4)];
      const ma = new MonthActuals(txs, [expenseCat, cat4]);
      expect(ma.getTotalExpenses().equals(d('-200'))).toBe(true);
    });
  });

  describe('savings category (TO_SAVINGS)', () => {
    it('savings tx → getTotalSavings includes it, getTotalExpenses excludes it', () => {
      const ma = new MonthActuals(
        [makeTx('-500', 5)],
        [expenseCat, savingsCat],
      );
      expect(ma.getTotalSavings().equals(d('-500'))).toBe(true);
      expect(ma.getTotalExpenses().equals(d('0'))).toBe(true);
      expect(ma.getCategoryTotal(5).equals(d('-500'))).toBe(true);
    });

    it('expense and savings tx → totals are separated', () => {
      const ma = new MonthActuals(
        [makeTx('-80', 1), makeTx('-500', 5)],
        [expenseCat, savingsCat],
      );
      expect(ma.getTotalExpenses().equals(d('-80'))).toBe(true);
      expect(ma.getTotalSavings().equals(d('-500'))).toBe(true);
    });

    it('no savings tx → getTotalSavings = 0', () => {
      const ma = new MonthActuals([makeTx('-80', 1)], [expenseCat, savingsCat]);
      expect(ma.getTotalSavings().equals(d('0'))).toBe(true);
    });
  });
});
