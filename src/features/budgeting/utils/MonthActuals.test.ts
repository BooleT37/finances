import Decimal from 'decimal.js';

import type { Category } from '~/features/categories/schema';

import { MonthActuals } from './MonthActuals';

const d = (n: string) => new Decimal(n);

function makeTx(cost: string, catId: number, subId: number | null = null) {
  return {
    cost: d(cost),
    categoryId: catId,
    subcategoryId: subId,
    components: [],
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

  describe('category and subcategory getters', () => {
    it('single expense tx → getCategoryTotal and getTotalExpenses reflect it', () => {
      const ma = new MonthActuals([makeTx('-80', 1)], [expenseCat]);
      expect(ma.getCategoryTotal(1).equals(d('-80'))).toBe(true);
      expect(ma.getTotalExpenses().equals(d('-80'))).toBe(true);
      expect(ma.getTotalIncome().equals(d('0'))).toBe(true);
    });

    it('getCategoryTotal for unknown id → 0', () => {
      const ma = new MonthActuals([makeTx('-80', 1)], [expenseCat]);
      expect(ma.getCategoryTotal(999).equals(d('0'))).toBe(true);
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

  describe('income/expense/savings rollups', () => {
    it('income category tx → getTotalIncome includes it, getTotalExpenses excludes it', () => {
      const ma = new MonthActuals([makeTx('200', 2)], [incomeCat]);
      expect(ma.getCategoryTotal(2).equals(d('200'))).toBe(true);
      expect(ma.getTotalIncome().equals(d('200'))).toBe(true);
      expect(ma.getTotalExpenses().equals(d('0'))).toBe(true);
    });

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

    it('getTotal → income + expenses + savings', () => {
      const ma = new MonthActuals(
        [makeTx('-80', 1), makeTx('200', 2), makeTx('-50', 5)],
        [expenseCat, incomeCat, savingsCat],
      );
      expect(ma.getTotal().equals(d('70'))).toBe(true);
    });
  });
});
