import { useQuery } from '@tanstack/react-query';
import type Decimal from 'decimal.js';
import { useAtomValue } from 'jotai';
import { useCallback } from 'react';

import type { Category } from '~/features/categories/schema';
import { getCategoryForecastsQueryOptions } from '~/features/forecasts/facets/categoryForecasts';
import { getSubcategoryForecastsQueryOptions } from '~/features/forecasts/facets/subcategoryForecasts';
import { findCategoryForecast } from '~/features/forecasts/utils/findCategoryForecast';
import { findSubcategoryForecast } from '~/features/forecasts/utils/findSubcategoryForecast';
import { getRestForecastSum } from '~/features/forecasts/utils/getRestForecastSum';
import { getSavingSpendingByCategoryIdQueryOptions } from '~/features/savingSpendings/facets/savingSpendingByCategoryId';
import { getTransactionsQueryOptions } from '~/features/transactions/queries';
import { decimalSum } from '~/shared/utils/decimalSum';
import { selectedYearAtom } from '~/stores/month';

interface Params {
  categoryId: number | undefined;
  categoryType: Category['type'];
  subcategoryId: number | undefined;
  isSubcategoryRow: boolean;
  month: number;
  year: number;
  isIncome: boolean;
}

export function useGetCostForecast() {
  const year = useAtomValue(selectedYearAtom);

  const { data: categoryForecasts } = useQuery(
    getCategoryForecastsQueryOptions(year),
  );
  const { data: subcategoryForecasts } = useQuery(
    getSubcategoryForecastsQueryOptions(year),
  );
  const { data: savingSpendingByCategoryId } = useQuery(
    getSavingSpendingByCategoryIdQueryOptions(),
  );
  const { data: transactions } = useQuery(getTransactionsQueryOptions(year));

  return useCallback(
    (params: Params): Decimal | undefined => {
      if (!categoryForecasts) {
        return undefined;
      }

      const {
        categoryId,
        categoryType,
        subcategoryId,
        isSubcategoryRow,
        month,
      } = params;

      if (categoryId === undefined) {
        return decimalSum(
          ...categoryForecasts
            .filter((f) => f.month === month && f.year === params.year)
            .map((f) => f.sum),
        );
      }

      if (categoryType === 'FROM_SAVINGS') {
        if (!savingSpendingByCategoryId || !transactions) {
          return undefined;
        }
        const forecasts = transactions
          .filter(
            (t) =>
              t.savingSpendingCategoryId !== null &&
              t.date.month() === month &&
              t.date.year() === params.year,
          )
          .map((t) => savingSpendingByCategoryId[t.savingSpendingCategoryId!])
          .filter(Boolean)
          .map((lookup) => lookup.category.forecast);
        return decimalSum(...forecasts);
      }

      if (isSubcategoryRow) {
        if (subcategoryId === undefined) {
          return getRestForecastSum(categoryForecasts, subcategoryForecasts, {
            categoryId,
            month,
            year: params.year,
          });
        }
        return findSubcategoryForecast(subcategoryForecasts ?? [], {
          categoryId,
          subcategoryId,
          month,
          year: params.year,
        })?.sum;
      }

      return findCategoryForecast(categoryForecasts, {
        categoryId,
        month,
        year: params.year,
      })?.sum;
    },
    [
      categoryForecasts,
      subcategoryForecasts,
      savingSpendingByCategoryId,
      transactions,
    ],
  );
}
