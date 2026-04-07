import Decimal from 'decimal.js';

import { MonthActuals } from './MonthActuals';
import { TransactionAverages } from './TransactionAverages';

const d = (n: string) => new Decimal(n);

function makeTx(cost: string, catId: number, subId: number | null = null) {
  return {
    cost: d(cost),
    categoryId: catId,
    subcategoryId: subId,
    components: [],
  };
}

const expenseCat = { id: 1, isIncome: false, subcategories: [] };
const incomeCat = { id: 2, isIncome: true, subcategories: [] };
const subCat = {
  id: 3,
  isIncome: false,
  subcategories: [{ id: 10 }, { id: 11 }],
};

/** Build a MonthActuals for a single list of transactions */
function monthOf(
  txs: ReturnType<typeof makeTx>[],
  cats = [expenseCat, incomeCat, subCat],
) {
  return new MonthActuals(txs, cats);
}

describe('TransactionAverages', () => {
  describe('empty — no months', () => {
    it('no months → all averages are zero with monthCount=0', () => {
      const avg = new TransactionAverages([], [expenseCat, subCat]);
      expect(avg.getTotalExpenses()).toEqual({
        average: d('0'),
        monthCount: 0,
      });
      expect(avg.getTotalIncome()).toEqual({ average: d('0'), monthCount: 0 });
      expect(avg.getCategoryTotal(1)).toEqual({
        average: d('0'),
        monthCount: 0,
      });
      expect(avg.getSubcategoryTotal(3, 10)).toEqual({
        average: d('0'),
        monthCount: 0,
      });
      expect(avg.getSubcategoryTotal(3, null)).toEqual({
        average: d('0'),
        monthCount: 0,
      });
    });
  });

  describe('single month', () => {
    it('single month with expense → monthCount=1, average = that month total', () => {
      const month = monthOf([makeTx('-90', 1)]);
      const avg = new TransactionAverages([month], [expenseCat]);
      const result = avg.getCategoryTotal(1);
      expect(result.monthCount).toBe(1);
      expect(result.average.equals(d('-90'))).toBe(true);
    });

    it('single month expense total → getTotalExpenses monthCount=1', () => {
      const month = monthOf([makeTx('-90', 1)]);
      const avg = new TransactionAverages([month], [expenseCat]);
      const result = avg.getTotalExpenses();
      expect(result.monthCount).toBe(1);
      expect(result.average.equals(d('-90'))).toBe(true);
    });
  });

  describe('zero-month exclusion', () => {
    it('one active month, one zero month → monthCount=1, average = active month value', () => {
      const active = monthOf([makeTx('-100', 1)]);
      const empty = monthOf([]);
      const avg = new TransactionAverages([active, empty], [expenseCat]);
      const result = avg.getCategoryTotal(1);
      expect(result.monthCount).toBe(1);
      expect(result.average.equals(d('-100'))).toBe(true);
    });

    it('all months zero for a category → monthCount=0, average=0', () => {
      const m1 = monthOf([]);
      const m2 = monthOf([]);
      const avg = new TransactionAverages([m1, m2], [expenseCat]);
      const result = avg.getCategoryTotal(1);
      expect(result.monthCount).toBe(0);
      expect(result.average.equals(d('0'))).toBe(true);
    });

    it('expense total: two months, one zero → monthCount=1', () => {
      const active = monthOf([makeTx('-150', 1)]);
      const empty = monthOf([]);
      const avg = new TransactionAverages([active, empty], [expenseCat]);
      const result = avg.getTotalExpenses();
      expect(result.monthCount).toBe(1);
      expect(result.average.equals(d('-150'))).toBe(true);
    });
  });

  describe('multi-month average', () => {
    it('three months with category totals -60, -90, -120 → average=-90, monthCount=3', () => {
      const months = [
        monthOf([makeTx('-60', 1)]),
        monthOf([makeTx('-90', 1)]),
        monthOf([makeTx('-120', 1)]),
      ];
      const avg = new TransactionAverages(months, [expenseCat]);
      const result = avg.getCategoryTotal(1);
      expect(result.monthCount).toBe(3);
      expect(result.average.equals(d('-90'))).toBe(true);
    });

    it('average excludes zero months from denominator even mid-series', () => {
      // totals: -60, 0, -120 → avg = (-60 + -120) / 2 = -90, monthCount=2
      const months = [
        monthOf([makeTx('-60', 1)]),
        monthOf([]),
        monthOf([makeTx('-120', 1)]),
      ];
      const avg = new TransactionAverages(months, [expenseCat]);
      const result = avg.getCategoryTotal(1);
      expect(result.monthCount).toBe(2);
      expect(result.average.equals(d('-90'))).toBe(true);
    });
  });

  describe('subcategory and rest row averages', () => {
    it('subId=10 active in two months → average=(sum)/2, monthCount=2', () => {
      const months = [
        monthOf([makeTx('-20', 3, 10)]),
        monthOf([makeTx('-40', 3, 10)]),
      ];
      const avg = new TransactionAverages(months, [subCat]);
      const result = avg.getSubcategoryTotal(3, 10);
      expect(result.monthCount).toBe(2);
      expect(result.average.equals(d('-30'))).toBe(true);
    });

    it('rest row: two months, one has rest activity, one does not → monthCount=1', () => {
      const months = [
        monthOf([makeTx('-50', 3, null)]),
        monthOf([makeTx('-40', 3, 10)]), // rest row is 0 this month
      ];
      const avg = new TransactionAverages(months, [subCat]);
      const result = avg.getSubcategoryTotal(3, null);
      expect(result.monthCount).toBe(1);
      expect(result.average.equals(d('-50'))).toBe(true);
    });

    it('unknown subcategory → ZERO_AVERAGE', () => {
      const avg = new TransactionAverages([monthOf([])], [subCat]);
      const result = avg.getSubcategoryTotal(3, 99);
      expect(result.monthCount).toBe(0);
      expect(result.average.equals(d('0'))).toBe(true);
    });
  });

  describe('typeGroup averages — getTotalExpenses / getTotalIncome', () => {
    it('expense totals -100, -200 → average=-150, monthCount=2', () => {
      const months = [
        monthOf([makeTx('-100', 1)]),
        monthOf([makeTx('-200', 1)]),
      ];
      const avg = new TransactionAverages(months, [expenseCat]);
      const result = avg.getTotalExpenses();
      expect(result.monthCount).toBe(2);
      expect(result.average.equals(d('-150'))).toBe(true);
    });

    it('income totals 300, 0 → average=300, monthCount=1', () => {
      const months = [monthOf([makeTx('300', 2)]), monthOf([])];
      const avg = new TransactionAverages(months, [incomeCat]);
      const result = avg.getTotalIncome();
      expect(result.monthCount).toBe(1);
      expect(result.average.equals(d('300'))).toBe(true);
    });
  });

  describe('parent-level averaging is independent of subcategory zero-months', () => {
    it('category active even when only one of two subcategories has activity', () => {
      // month 1: sub10=-60, sub11=0  → category total = -60 (non-zero month)
      // month 2: sub10=0,  sub11=-30 → category total = -30 (non-zero month)
      // category monthCount = 2, average = -45
      // but sub10 monthCount = 1, sub11 monthCount = 1
      const months = [
        monthOf([makeTx('-60', 3, 10)]),
        monthOf([makeTx('-30', 3, 11)]),
      ];
      const avg = new TransactionAverages(months, [subCat]);

      const catResult = avg.getCategoryTotal(3);
      expect(catResult.monthCount).toBe(2);
      expect(catResult.average.equals(d('-45'))).toBe(true);

      const sub10Result = avg.getSubcategoryTotal(3, 10);
      expect(sub10Result.monthCount).toBe(1);
      expect(sub10Result.average.equals(d('-60'))).toBe(true);

      const sub11Result = avg.getSubcategoryTotal(3, 11);
      expect(sub11Result.monthCount).toBe(1);
      expect(sub11Result.average.equals(d('-30'))).toBe(true);
    });
  });

  describe('unknown category fallback', () => {
    it('getCategoryTotal for unknown id → ZERO_AVERAGE', () => {
      const avg = new TransactionAverages([monthOf([])], [expenseCat]);
      const result = avg.getCategoryTotal(999);
      expect(result.monthCount).toBe(0);
      expect(result.average.equals(d('0'))).toBe(true);
    });
  });
});
