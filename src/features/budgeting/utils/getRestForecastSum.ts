import Decimal from 'decimal.js';

import { decimalSum } from '~/shared/utils/decimalSum';

import type { Forecast } from '../schema';
import { findCategoryForecast } from './findCategoryForecast';

export function getRestForecastSum(
  categoryForecasts: Forecast[] | undefined,
  subcategoryForecasts: Forecast[] | undefined,
  params: { categoryId: number; month: number; year: number },
): Decimal {
  if (!categoryForecasts) {
    return new Decimal(0);
  }

  const categoryForecast = findCategoryForecast(categoryForecasts, params);
  if (!categoryForecast) {
    return new Decimal(0);
  }

  const subcategoriesSum = subcategoryForecasts
    ? decimalSum(
        ...subcategoryForecasts
          .filter(
            (f) =>
              f.categoryId === params.categoryId &&
              f.month === params.month &&
              f.year === params.year,
          )
          .map((f) => f.sum),
      )
    : new Decimal(0);

  return categoryForecast.sum.minus(subcategoriesSum);
}
