import type { Forecast } from '../schema';

export function findSubcategoryForecast(
  forecasts: Forecast[],
  params: {
    categoryId: number;
    subcategoryId: number;
    month: number;
    year: number;
  },
): Forecast | undefined {
  return forecasts.find(
    (f) =>
      f.categoryId === params.categoryId &&
      f.subcategoryId === params.subcategoryId &&
      f.month === params.month &&
      f.year === params.year,
  );
}
