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
import { getSavingSpendingCategoryMapQueryOptions } from '~/features/savingSpendings/facets/savingSpendingCategoryMap';
import { getTransactionsQueryOptions } from '~/features/transactions/queries';
import { decimalSum } from '~/shared/utils/decimalSum';
import { getOrThrow } from '~/shared/utils/getOrThrow';
import { selectedYearAtom } from '~/stores/month';

interface Params {
  categoryId: number | undefined;
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
  const { data: savingSpendingCategoryMap } = useQuery(
    getSavingSpendingCategoryMapQueryOptions(),
  );
  const { data: transactions } = useQuery(getTransactionsQueryOptions(year));
  const { data: categoryMap } = useQuery(getCategoryMapQueryOptions());

  return useCallback(
    (params: Params): Decimal | undefined => {
      if (!categoryForecasts || !categoryMap) {
        return undefined;
      }

      const { categoryId, subcategoryId, isSubcategoryRow, month, isIncome } =
        params;

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
                f.year === params.year &&
                category.isIncome === isIncome &&
                category.type !== 'FROM_SAVINGS'
              );
            })
            .map((f) => f.sum),
        );
      }

      const categoryType = getOrThrow(categoryMap, categoryId, 'Category').type;

      if (categoryType === 'FROM_SAVINGS') {
        if (!savingSpendingCategoryMap || !transactions) {
          return undefined;
        }
        const forecasts = transactions.flatMap((tx) =>
          tx.savingSpendingCategoryId !== null &&
          tx.date.month() === month &&
          tx.date.year() === params.year
            ? [
                getOrThrow(
                  savingSpendingCategoryMap,
                  tx.savingSpendingCategoryId,
                  'SavingSpendingCategory',
                ).forecast,
              ]
            : [],
        );
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
      savingSpendingCategoryMap,
      transactions,
      categoryMap,
    ],
  );
}
