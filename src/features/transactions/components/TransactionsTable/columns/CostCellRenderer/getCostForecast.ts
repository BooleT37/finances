import { useQuery } from '@tanstack/react-query';
import type Decimal from 'decimal.js';
import { useAtomValue } from 'jotai';
import { useCallback } from 'react';

import { getCategoryForecastsQueryOptions } from '~/features/budgeting/facets/categoryForecasts';
import { getSubcategoryForecastsQueryOptions } from '~/features/budgeting/facets/subcategoryForecasts';
import type { Forecast } from '~/features/budgeting/schema';
import { findCategoryForecast } from '~/features/budgeting/utils/findCategoryForecast';
import { findSubcategoryForecast } from '~/features/budgeting/utils/findSubcategoryForecast';
import { getRestForecastSum } from '~/features/budgeting/utils/getRestForecastSum';
import { getCategoryMapQueryOptions } from '~/features/categories/facets/categoryMap';
import type { Category } from '~/features/categories/schema';
import { getSavingSpendingsQueryOptions } from '~/features/savingSpendings/queries';
import type { SavingSpending } from '~/features/savingSpendings/schema';
import { decimalSum } from '~/shared/utils/decimalSum';
import { getOrThrow } from '~/shared/utils/getOrThrow';
import { selectedMonth0BasedAtom, selectedYearAtom } from '~/stores/month';

/** We only have forecasts for group rows, not for individual expenses
 * The structure of forecasts is:
 * - expense
 * - - Category 1
 * - - Category 2
 * - - - Subcategory 2.1
 * - - - Subcategory 2.2
 * - - - Rest of Category 2
 * - income
 * - - Category 3
 * - - Category 4
 * - - - Subcategory 4.1
 * - - - Subcategory 4.2
 * - - - Rest of Category 4
 */
export interface GetCostForecastParams {
  /** Category id. Undefined if it's "expense" or "income" group row */
  categoryId: number | undefined;
  /** Subcategory id. Only defined if it's a subcategory row, but not the "rest" one */
  subcategoryId: number | undefined;
  /** Indicator that this is "Rest of Category X" row  */
  isRestRow: boolean;
  /** Is the row nested under (or is) the "income" group */
  isIncome: boolean;
}

interface GetCostForecastData {
  categoryForecasts: Forecast[];
  subcategoryForecasts: Forecast[] | undefined;
  savingSpendings: SavingSpending[];
  categoryMap: Record<number, Category>;
  month: number;
  year: number;
}

export function getCostForecast(
  data: GetCostForecastData,
  params: GetCostForecastParams,
): Decimal | undefined {
  const {
    categoryForecasts,
    subcategoryForecasts,
    savingSpendings,
    categoryMap,
    month,
    year,
  } = data;
  const { categoryId, subcategoryId, isRestRow, isIncome } = params;

  if (categoryId === undefined) {
    return decimalSum(
      ...categoryForecasts
        .filter((f) => {
          const category = getOrThrow(categoryMap, f.categoryId, 'Category');
          return (
            f.month === month &&
            f.year === year &&
            category.isIncome === isIncome &&
            category.type !== 'FROM_SAVINGS'
          );
        })
        .map((f) => f.sum),
    );
  }

  const categoryType = getOrThrow(categoryMap, categoryId, 'Category').type;

  if (categoryType === 'FROM_SAVINGS') {
    if (subcategoryId === undefined) {
      console.error(
        'getCostForecast: subcategoryId must be defined for FROM_SAVINGS category rows',
      );
    }
    return decimalSum(
      ...savingSpendings
        .filter((s) => s.id === subcategoryId)
        .flatMap((s) => s.categories)
        .map((cat) => cat.forecast),
    );
  }

  if (isRestRow) {
    return getRestForecastSum(categoryForecasts, subcategoryForecasts, {
      categoryId,
      month,
      year,
    });
  }

  if (subcategoryId !== undefined) {
    return findSubcategoryForecast(subcategoryForecasts ?? [], {
      categoryId,
      subcategoryId,
      month,
      year,
    })?.sum;
  }

  return findCategoryForecast(categoryForecasts, {
    categoryId,
    month,
    year,
  })?.sum;
}

export function useGetCostForecast() {
  const year = useAtomValue(selectedYearAtom);
  const month = useAtomValue(selectedMonth0BasedAtom);

  const { data: categoryForecasts } = useQuery(
    getCategoryForecastsQueryOptions(year),
  );
  const { data: subcategoryForecasts } = useQuery(
    getSubcategoryForecastsQueryOptions(year),
  );
  const { data: savingSpendings } = useQuery(getSavingSpendingsQueryOptions());
  const { data: categoryMap } = useQuery(getCategoryMapQueryOptions());

  return useCallback(
    (params: GetCostForecastParams): Decimal | undefined => {
      if (!categoryForecasts || !categoryMap || !savingSpendings) {
        return undefined;
      }
      return getCostForecast(
        {
          categoryForecasts,
          subcategoryForecasts,
          savingSpendings,
          categoryMap,
          month,
          year,
        },
        params,
      );
    },
    [
      categoryForecasts,
      subcategoryForecasts,
      savingSpendings,
      categoryMap,
      month,
      year,
    ],
  );
}
