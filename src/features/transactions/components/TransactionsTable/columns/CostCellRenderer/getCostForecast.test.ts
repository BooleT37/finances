import Decimal from 'decimal.js';
import { vi } from 'vitest';

import { fetchAllCategories } from '~/features/categories/api';
import type { CategoryWire } from '~/features/categories/schema';
import { fetchForecastsByYear } from '~/features/forecasts/api';
import type { ForecastWire } from '~/features/forecasts/schema';
import { fetchAllSavingSpendings } from '~/features/savingSpendings/api';
import type { SavingSpendingWire } from '~/features/savingSpendings/schema';
import { renderHook, waitFor } from '~/test/render';

import { useGetCostForecast } from './getCostForecast';

vi.mock('~/features/forecasts/api', () => ({ fetchForecastsByYear: vi.fn() }));
vi.mock('~/features/categories/api', () => ({ fetchAllCategories: vi.fn() }));
vi.mock('~/features/savingSpendings/api', () => ({
  fetchAllSavingSpendings: vi.fn(),
}));

// Matches '2026-03' in localStorage: year=2026, month=2 (0-based March)
const YEAR = 2026;
const MONTH = 2;

const mockCategories: CategoryWire[] = [
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

function makeForecast(
  forecast: Omit<ForecastWire, 'month' | 'year'>,
): ForecastWire {
  return {
    month: MONTH,
    year: YEAR,
    ...forecast,
  };
}

const mockForecasts = [
  { categoryId: 1, subcategoryId: null, sum: '-100.00' },
  { categoryId: 3, subcategoryId: null, sum: '200.00' },
  { categoryId: 4, subcategoryId: null, sum: '-150.00' },
  { categoryId: 4, subcategoryId: 41, sum: '-60.00' },
  { categoryId: 4, subcategoryId: 42, sum: '-40.00' },
  // Cat5 has no forecast — used for "returns undefined" tests
].map(makeForecast);

const mockSavingSpendings: SavingSpendingWire[] = [
  {
    id: 1,
    name: 'Отпуск',
    completed: false,
    categories: [
      {
        id: 1,
        name: 'Билеты',
        forecast: '500.00',
        comment: '',
        savingSpendingId: 1,
      },
      {
        id: 2,
        name: 'Отель',
        forecast: '300.00',
        comment: '',
        savingSpendingId: 1,
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
        forecast: '400.00',
        comment: '',
        savingSpendingId: 2,
      },
    ],
  },
];

beforeEach(() => {
  localStorage.setItem('finances.selectedMonth', '2026-03');
  vi.mocked(fetchForecastsByYear).mockResolvedValue(mockForecasts);
  vi.mocked(fetchAllCategories).mockResolvedValue(mockCategories);
  vi.mocked(fetchAllSavingSpendings).mockResolvedValue([]);
});

/**
 * Renders useGetCostForecast and waits until categoryForecasts + categoryMap are
 * loaded (confirmed by a known-existing forecast returning a Decimal, not undefined).
 */
async function renderAndLoad() {
  const { result } = renderHook(() => useGetCostForecast());
  await waitFor(() => {
    expect(
      result.current({
        categoryId: 1,
        subcategoryId: undefined,
        isRestRow: false,
        isIncome: false,
      }),
    ).toBeDefined();
  });
  return result.current;
}

describe('useGetCostForecast', () => {
  describe('total row (categoryId undefined)', () => {
    it('sums expense category forecasts, excluding FROM_SAVINGS categories', async () => {
      const getCostForecast = await renderAndLoad();
      // Cat1 (-100) + Cat4 (-150) = -250; Cat2 (FROM_SAVINGS) excluded
      expect(
        getCostForecast({
          categoryId: undefined,
          subcategoryId: undefined,
          isRestRow: false,
          isIncome: false,
        })?.equals(new Decimal('-250')),
      ).toBe(true);
    });

    it('sums income category forecasts', async () => {
      const getCostForecast = await renderAndLoad();
      // Cat3 (200)
      expect(
        getCostForecast({
          categoryId: undefined,
          subcategoryId: undefined,
          isRestRow: false,
          isIncome: true,
        })?.equals(new Decimal('200')),
      ).toBe(true);
    });
  });

  describe('category row (categoryId defined, no subcategory)', () => {
    it('returns the category-level forecast — expense sum is negative', async () => {
      const getCostForecast = await renderAndLoad();
      expect(
        getCostForecast({
          categoryId: 1,
          subcategoryId: undefined,
          isRestRow: false,
          isIncome: false,
        })?.equals(new Decimal('-100')),
      ).toBe(true);
    });

    it('income category forecast sum is positive', async () => {
      const getCostForecast = await renderAndLoad();
      const forecast = getCostForecast({
        categoryId: 3,
        subcategoryId: undefined,
        isRestRow: false,
        isIncome: true,
      });
      expect(forecast?.greaterThan(0)).toBe(true);
    });

    it('returns undefined when no forecast exists for the category', async () => {
      const getCostForecast = await renderAndLoad();
      // Cat5 has no forecast entry in mockForecasts
      expect(
        getCostForecast({
          categoryId: 5,
          subcategoryId: undefined,
          isRestRow: false,
          isIncome: false,
        }),
      ).toBeUndefined();
    });
  });

  describe('FROM_SAVINGS category', () => {
    beforeEach(() => {
      vi.mocked(fetchAllSavingSpendings).mockResolvedValue(mockSavingSpendings);
    });

    it('sums category forecasts for the specified saving spending event, excluding other events', async () => {
      const getCostForecast = await renderAndLoad();
      // Отпуск (id=1): Билеты (500) + Отель (300) = 800; Переезд (id=2) excluded
      expect(
        getCostForecast({
          categoryId: 2,
          subcategoryId: 1,
          isRestRow: false,
          isIncome: false,
        })?.equals(new Decimal('800')),
      ).toBe(true);
    });
  });

  describe('subcategory row', () => {
    it('returns the subcategory-level forecast', async () => {
      const getCostForecast = await renderAndLoad();
      expect(
        getCostForecast({
          categoryId: 4,
          subcategoryId: 41,
          isRestRow: false,
          isIncome: false,
        })?.equals(new Decimal('-60')),
      ).toBe(true);
    });

    it('returns undefined when no forecast exists for the subcategory', async () => {
      const getCostForecast = await renderAndLoad();
      // subcategoryId 99 has no entry in mockForecasts
      expect(
        getCostForecast({
          categoryId: 5,
          subcategoryId: 51,
          isRestRow: false,
          isIncome: false,
        }),
      ).toBeUndefined();
    });
  });

  describe('rest row (isRestRow)', () => {
    it('returns category forecast minus sum of subcategory forecasts', async () => {
      const getCostForecast = await renderAndLoad();
      // Cat4 category forecast: -150; subcategory forecasts: -60 + -40 = -100; rest = -50
      expect(
        getCostForecast({
          categoryId: 4,
          subcategoryId: undefined,
          isRestRow: true,
          isIncome: false,
        })?.equals(new Decimal('-50')),
      ).toBe(true);
    });
  });
});
