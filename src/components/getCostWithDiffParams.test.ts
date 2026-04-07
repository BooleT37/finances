import Decimal from 'decimal.js';

import { TODAY_MONTH, TODAY_YEAR } from '~/shared/utils/today';

import { getCostWithDiffParams } from './getCostWithDiffParams';

const col = (cost: string) => ({ cost: new Decimal(cost) });

describe('getCostWithDiffParams', () => {
  describe('past month', () => {
    it('under-budget expense → green', () => {
      const result = getCostWithDiffParams({
        value: col('-80'),
        forecast: new Decimal('-100'),
        isContinuous: false,
        month: 0,
        year: 2024,
      });
      expect(result.color).toBe('green');
      expect(result.diff.equals(new Decimal('20'))).toBe(true);
      expect(result.barLength).toBe(0.8);
      expect(result.barOffset).toBe(0);
      expect(result.exceedingAmount).toBeUndefined();
    });

    it('over-budget expense → red with barOffset', () => {
      const result = getCostWithDiffParams({
        value: col('-120'),
        forecast: new Decimal('-100'),
        isContinuous: false,
        month: 0,
        year: 2024,
      });
      expect(result.color).toBe('red');
      expect(result.barOffset).toBe(5 / 6);
      expect(result.barLength).toBe(1 / 6);
      expect(result.exceedingAmount).toBeUndefined();
    });
  });

  // TODAY_YEAR=2024, TODAY_MONTH=3 (April 0-based, 30 days), TODAY_DAY=15
  describe('current month, non-continuous', () => {
    it('spending ahead of pace, isContinuous=false → green (not orange)', () => {
      // spentRatio = 0.8 > passedDaysRatio (0.5)
      const result = getCostWithDiffParams({
        value: col('-80'),
        forecast: new Decimal('-100'),
        isContinuous: false,
        month: TODAY_MONTH,
        year: TODAY_YEAR,
      });
      expect(result.color).toBe('green');
      expect(result.barLength).toBe(0.8);
      expect(result.exceedingAmount).toBeUndefined();
    });
  });

  // passedDaysRatio for current month = 15/30 = 0.5
  describe('current month, continuous', () => {
    it('spending behind pace → green', () => {
      // spentRatio = 0.4 < passedDaysRatio (0.5)
      const result = getCostWithDiffParams({
        value: col('-40'),
        forecast: new Decimal('-100'),
        isContinuous: true,
        month: TODAY_MONTH,
        year: TODAY_YEAR,
      });
      expect(result.color).toBe('green');
      expect(result.barLength).toBe(0.4);
      expect(result.exceedingAmount).toBeUndefined();
    });

    it('spending ahead of pace → orange with exact exceedingAmount', () => {
      // spentRatio = 0.8 > 0.5; exceedingAmount = |(-80) - 0.5*(-100)| = 30
      const result = getCostWithDiffParams({
        value: col('-80'),
        forecast: new Decimal('-100'),
        isContinuous: true,
        month: TODAY_MONTH,
        year: TODAY_YEAR,
      });
      expect(result.color).toBe('orange');
      expect(result.barLength).toBe(0.8);
      expect(result.exceedingAmount?.equals(new Decimal(30))).toBe(true);
    });

    it('over-budget → red (over-budget path; orange never applies)', () => {
      const result = getCostWithDiffParams({
        value: col('-120'),
        forecast: new Decimal('-100'),
        isContinuous: true,
        month: TODAY_MONTH,
        year: TODAY_YEAR,
      });
      expect(result.color).toBe('red');
      expect(result.barOffset).toBe(5 / 6);
      expect(result.barLength).toBe(1 / 6);
      expect(result.exceedingAmount).toBeUndefined();
    });
  });

  describe('zero forecast', () => {
    it('cost = 0, forecast = 0 → divideWithFallbackToOne prevents NaN; barLength = 1', () => {
      const result = getCostWithDiffParams({
        value: col('0'),
        forecast: new Decimal('0'),
        isContinuous: false,
        month: 0,
        year: 2024,
      });
      expect(result.barLength).toBe(1);
      expect(result.barOffset).toBe(0);
    });
  });

  describe('income row', () => {
    it('under-earned income → red', () => {
      const result = getCostWithDiffParams({
        value: col('80'),
        forecast: new Decimal('100'),
        isContinuous: false,
        month: 0,
        year: 2024,
      });
      expect(result.color).toBe('red');
      expect(result.barLength).toBe(0.8);
      expect(result.barOffset).toBe(0);
      expect(result.exceedingAmount).toBeUndefined();
    });

    it('over-earned income → green with barOffset', () => {
      const result = getCostWithDiffParams({
        value: col('120'),
        forecast: new Decimal('100'),
        isContinuous: false,
        month: 0,
        year: 2024,
      });
      expect(result.color).toBe('green');
      expect(result.barOffset).toBe(5 / 6);
      expect(result.barLength).toBe(1 / 6);
    });
  });
});
