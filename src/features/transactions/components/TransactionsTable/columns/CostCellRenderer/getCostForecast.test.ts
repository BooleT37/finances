import Decimal from 'decimal.js';
import { indexBy, prop } from 'ramda';

import type { Forecast } from '~/features/budgeting/schema';
import type { Category } from '~/features/categories/schema';
import type { SavingSpending } from '~/features/savingSpendings/schema';

import { getCostForecast } from './getCostForecast';

const YEAR = 2026;
const MONTH = 2; // 0-based March

const mockCategories: Category[] = [
  {
    id: 1,
    name: 'Продукты',
    shortname: 'продукты',
    type: null,
    isIncome: false,
    isContinuous: false,
    icon: null,
    subcategories: [],
  },
  {
    id: 2,
    name: 'Из сбережений',
    shortname: 'сбережения',
    type: 'FROM_SAVINGS',
    isIncome: false,
    isContinuous: false,
    icon: null,
    subcategories: [],
  },
  {
    id: 3,
    name: 'Зарплата',
    shortname: 'зарплата',
    type: null,
    isIncome: true,
    isContinuous: false,
    icon: null,
    subcategories: [],
  },
  {
    id: 4,
    name: 'Транспорт',
    shortname: 'транспорт',
    type: null,
    isIncome: false,
    isContinuous: true,
    icon: null,
    subcategories: [
      { id: 41, name: 'Автобус' },
      { id: 42, name: 'Такси' },
    ],
  },
  {
    id: 5,
    name: 'Подарки',
    shortname: 'подарки',
    type: null,
    isIncome: false,
    isContinuous: false,
    icon: null,
    subcategories: [{ id: 51, name: 'День рождения' }],
  },
];

const mockCategoryMap = indexBy(prop('id'), mockCategories);

function makeForecast(
  forecast: Omit<
    Forecast,
    'id' | 'month' | 'year' | 'sum' | 'comment' | 'lineItems'
  > & {
    sum: string;
  },
  index: number,
): Forecast {
  return {
    id: index + 1,
    month: MONTH,
    year: YEAR,
    comment: '',
    lineItems: [],
    ...forecast,
    sum: new Decimal(forecast.sum),
  };
}

const mockForecasts: Forecast[] = (
  [
    { categoryId: 1, subcategoryId: null, level: 'CATEGORY', sum: '-100.00' },
    { categoryId: 3, subcategoryId: null, level: 'CATEGORY', sum: '200.00' },
    { categoryId: 4, subcategoryId: null, level: 'CATEGORY', sum: '-150.00' },
    { categoryId: 4, subcategoryId: 41, level: 'SUBCATEGORY', sum: '-60.00' },
    { categoryId: 4, subcategoryId: 42, level: 'SUBCATEGORY', sum: '-40.00' },
    // Rest is materialized alongside 41/42 — the server creates it atomically
    // the moment any subcategory is first touched, so a state with real
    // subcategory forecasts but no Rest row can't occur.
    { categoryId: 4, subcategoryId: null, level: 'SUBCATEGORY', sum: '-50.00' },
    // Cat5 has no forecast — used for "returns undefined" tests
  ] as const
).map(makeForecast);

const mockSavingSpendings: SavingSpending[] = [
  {
    id: 1,
    name: 'Отпуск',
    completed: false,
    categories: [
      {
        id: 1,
        name: 'Билеты',
        forecast: new Decimal('500.00'),
        comment: '',
        savingSpendingId: 1,
        actual: new Decimal('0'),
        expensesCount: 0,
      },
      {
        id: 2,
        name: 'Отель',
        forecast: new Decimal('300.00'),
        comment: '',
        savingSpendingId: 1,
        actual: new Decimal('0'),
        expensesCount: 0,
      },
    ],
  },
  {
    id: 2,
    name: 'Переезд',
    completed: false,
    categories: [
      {
        id: 3,
        name: 'Грузчики',
        forecast: new Decimal('400.00'),
        comment: '',
        savingSpendingId: 2,
        actual: new Decimal('0'),
        expensesCount: 0,
      },
    ],
  },
];

const baseData = {
  categoryForecasts: mockForecasts.filter((f) => f.level === 'CATEGORY'),
  subcategoryForecasts: mockForecasts.filter((f) => f.level === 'SUBCATEGORY'),
  savingSpendings: [] as SavingSpending[],
  categoryMap: mockCategoryMap,
  month: MONTH,
  year: YEAR,
};

describe('getCostForecast', () => {
  describe('total row (categoryId undefined)', () => {
    it('sums expense category forecasts, excluding FROM_SAVINGS categories', () => {
      // Cat1 (-100) + Cat4 (-150) = -250; Cat2 (FROM_SAVINGS) excluded
      expect(
        getCostForecast(baseData, {
          categoryId: undefined,
          subcategoryId: undefined,
          isRestRow: false,
          isIncome: false,
        })?.equals(new Decimal('-250')),
      ).toBe(true);
    });

    it('sums income category forecasts', () => {
      // Cat3 (200)
      expect(
        getCostForecast(baseData, {
          categoryId: undefined,
          subcategoryId: undefined,
          isRestRow: false,
          isIncome: true,
        })?.equals(new Decimal('200')),
      ).toBe(true);
    });
  });

  describe('category row (categoryId defined, no subcategory)', () => {
    it('returns the category-level forecast — expense sum is negative', () => {
      expect(
        getCostForecast(baseData, {
          categoryId: 1,
          subcategoryId: undefined,
          isRestRow: false,
          isIncome: false,
        })?.equals(new Decimal('-100')),
      ).toBe(true);
    });

    it('income category forecast sum is positive', () => {
      expect(
        getCostForecast(baseData, {
          categoryId: 3,
          subcategoryId: undefined,
          isRestRow: false,
          isIncome: true,
        })?.greaterThan(0),
      ).toBe(true);
    });

    it('returns undefined when no forecast exists for the category', () => {
      // Cat5 has no forecast entry
      expect(
        getCostForecast(baseData, {
          categoryId: 5,
          subcategoryId: undefined,
          isRestRow: false,
          isIncome: false,
        }),
      ).toBeUndefined();
    });
  });

  describe('FROM_SAVINGS category', () => {
    it('sums category forecasts for the specified saving spending event, excluding other events', () => {
      // Отпуск (id=1): Билеты (500) + Отель (300) = 800; Переезд (id=2) excluded
      expect(
        getCostForecast(
          { ...baseData, savingSpendings: mockSavingSpendings },
          {
            categoryId: 2,
            subcategoryId: 1,
            isRestRow: false,
            isIncome: false,
          },
        )?.equals(new Decimal('800')),
      ).toBe(true);
    });
  });

  describe('subcategory row', () => {
    it('returns the subcategory-level forecast', () => {
      expect(
        getCostForecast(baseData, {
          categoryId: 4,
          subcategoryId: 41,
          isRestRow: false,
          isIncome: false,
        })?.equals(new Decimal('-60')),
      ).toBe(true);
    });

    it('returns undefined when no forecast exists for the subcategory', () => {
      expect(
        getCostForecast(baseData, {
          categoryId: 5,
          subcategoryId: 51,
          isRestRow: false,
          isIncome: false,
        }),
      ).toBeUndefined();
    });
  });

  describe('rest row (isRestRow)', () => {
    it('returns the materialized Rest forecast', () => {
      expect(
        getCostForecast(baseData, {
          categoryId: 4,
          subcategoryId: undefined,
          isRestRow: true,
          isIncome: false,
        })?.equals(new Decimal('-50')),
      ).toBe(true);
    });
  });
});
