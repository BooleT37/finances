import { useQuery } from '@tanstack/react-query';
import type Decimal from 'decimal.js';
import { useAtomValue } from 'jotai';
import { useCallback } from 'react';

import { getCategoryMapQueryOptions } from '~/features/categories/facets/categoryMap';
import { getCategoryForecastsQueryOptions } from '~/features/forecasts/facets/categoryForecasts';
import { getSubcategoryForecastsQueryOptions } from '~/features/forecasts/facets/subcategoryForecasts';
import { findCategoryForecast } from '~/features/forecasts/utils/findCategoryForecast';
import { findSubcategoryForecast } from '~/features/forecasts/utils/findSubcategoryForecast';
import { getRestForecastSum } from '~/features/forecasts/utils/getRestForecastSum';
import { getSavingSpendingsQueryOptions } from '~/features/savingSpendings/queries';
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

      const { categoryId, subcategoryId, isRestRow, isIncome } = params;

      if (categoryId === undefined) {
        return decimalSum(
          ...categoryForecasts
            .filter((f) => {
              const category = getOrThrow(
                categoryMap,
                f.categoryId,
                'Category',
              );
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
            'useGetCostForecast: subcategoryId must be defined for FROM_SAVINGS category rows',
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
