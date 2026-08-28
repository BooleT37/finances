import type { Forecast } from '../schema';

/**
 * `subcategoryId: null` finds the Rest forecast — the same convention
 * `Expense.subcategoryId = null` uses for "no subcategory".
 */
export function findSubcategoryForecast(
  forecasts: Forecast[],
  params: {
    categoryId: number;
    subcategoryId: number | null;
    month: number;
    year: number;
  },
): Forecast | undefined {
  return forecasts.find(
    (f) =>
      f.categoryId === params.categoryId &&
      f.subcategoryId === params.subcategoryId &&
      f.level === 'SUBCATEGORY' &&
      f.month === params.month &&
      f.year === params.year,
  );
}
