import type { Forecast } from '../schema';

export function findCategoryForecast(
  forecasts: Forecast[],
  params: { categoryId: number; month: number; year: number },
): Forecast | undefined {
  return forecasts.find(
    (f) =>
      f.categoryId === params.categoryId &&
      f.month === params.month &&
      f.year === params.year,
  );
}
