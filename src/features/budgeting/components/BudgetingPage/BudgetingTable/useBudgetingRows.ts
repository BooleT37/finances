import { useQuery } from '@tanstack/react-query';
import Decimal from 'decimal.js';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getForecastsQueryOptions } from '~/features/budgeting/queries';
import type { Forecast } from '~/features/budgeting/schema';
import { findCategoryForecast } from '~/features/budgeting/utils/findCategoryForecast';
import { findSubcategoryForecast } from '~/features/budgeting/utils/findSubcategoryForecast';
import {
  useSortAllCategoriesById,
  useSortSubcategories,
} from '~/features/categories/facets/categoriesOrder';
import { getCategoriesQueryOptions } from '~/features/categories/queries';
import type { Category } from '~/features/categories/schema';
import { decimalSum } from '~/shared/utils/decimalSum';

import { buildBudgetingRowId } from './budgetingRowId';
import type { BudgetingRow } from './BudgetingTable.types';
import { REST_SUBCATEGORY_ID } from './constants';

const ZERO = new Decimal(0);

function buildCategoryRows(
  categories: Category[],
  forecasts: Forecast[],
  month: number,
  year: number,
  restSubcategoryName: string,
  sortSubcategories: (
    categoryId: number,
    sub1Id: number | null,
    sub2Id: number | null,
  ) => number,
): BudgetingRow[] {
  return categories.map((category) => {
    const catForecast = findCategoryForecast(forecasts, {
      categoryId: category.id,
      month,
      year,
    });
    const categoryPlanSum = catForecast?.sum ?? ZERO;

    if (category.subcategories.length === 0) {
      return {
        id: buildBudgetingRowId({
          rowType: 'category',
          categoryId: category.id,
        }),
        rowType: 'category',
        name: category.name,
        icon: category.icon,
        categoryId: category.id,
        subcategoryId: null,
        isRestRow: false,
        isIncome: category.isIncome,
        planSum: categoryPlanSum,
        comment: catForecast?.comment ?? '',
      } satisfies BudgetingRow;
    }

    const subcategoryRows: BudgetingRow[] = category.subcategories.map(
      (sub) => {
        const subForecast = findSubcategoryForecast(forecasts, {
          categoryId: category.id,
          subcategoryId: sub.id,
          month,
          year,
        });
        return {
          id: buildBudgetingRowId({
            rowType: 'subcategory',
            categoryId: category.id,
            subcategoryId: sub.id,
          }),
          rowType: 'subcategory',
          name: sub.name,
          icon: null,
          categoryId: category.id,
          subcategoryId: sub.id,
          isRestRow: false,
          isIncome: category.isIncome,
          planSum: subForecast?.sum ?? ZERO,
          comment: subForecast?.comment ?? '',
        } satisfies BudgetingRow;
      },
    );

    subcategoryRows.sort((a, b) =>
      sortSubcategories(category.id, a.subcategoryId, b.subcategoryId),
    );

    const subcategorySum = decimalSum(...subcategoryRows.map((r) => r.planSum));
    const restPlanSum = categoryPlanSum;

    const subRows: BudgetingRow[] = [
      ...subcategoryRows,
      {
        id: buildBudgetingRowId({ rowType: 'rest', categoryId: category.id }),
        rowType: 'subcategory',
        name: restSubcategoryName,
        icon: null,
        categoryId: category.id,
        subcategoryId: REST_SUBCATEGORY_ID,
        isRestRow: true,
        isIncome: category.isIncome,
        planSum: restPlanSum,
        comment: '',
      },
    ];

    return {
      id: buildBudgetingRowId({ rowType: 'category', categoryId: category.id }),
      rowType: 'category',
      name: category.name,
      icon: category.icon,
      categoryId: category.id,
      subcategoryId: null,
      isRestRow: false,
      isIncome: category.isIncome,
      planSum: subcategorySum.plus(restPlanSum),
      comment: catForecast?.comment ?? '',
      subRows,
    } satisfies BudgetingRow;
  });
}

export function useBudgetingRows(
  month: number,
  year: number,
): {
  rows: BudgetingRow[] | undefined;
  isLoading: boolean;
} {
  const { t } = useTranslation('budgeting');
  const { data: categories } = useQuery(getCategoriesQueryOptions());
  const { data: forecasts } = useQuery(getForecastsQueryOptions(year));
  const sortAllCategoriesById = useSortAllCategoriesById();
  const sortSubcategories = useSortSubcategories();

  const rows = useMemo<BudgetingRow[] | undefined>(() => {
    if (!categories || !forecasts) {
      return undefined;
    }

    const filtered = categories.filter((c) => c.type !== 'FROM_SAVINGS');
    const sorted = [...filtered].sort((a, b) =>
      sortAllCategoriesById(a.id, b.id),
    );

    const expenseCategories = sorted.filter((c) => !c.isIncome);
    const incomeCategories = sorted.filter((c) => c.isIncome);
    const restSubcategoryName = t('restSubcategory');

    const expenseRows = buildCategoryRows(
      expenseCategories,
      forecasts,
      month,
      year,
      restSubcategoryName,
      sortSubcategories,
    );
    const incomeRows = buildCategoryRows(
      incomeCategories,
      forecasts,
      month,
      year,
      restSubcategoryName,
      sortSubcategories,
    );

    return [
      {
        id: buildBudgetingRowId({ rowType: 'typeGroup', isIncome: false }),
        rowType: 'typeGroup',
        name: t('expenses'),
        icon: null,
        categoryId: null,
        subcategoryId: null,
        isRestRow: false,
        isIncome: false,
        planSum: decimalSum(...expenseRows.map((r) => r.planSum)),
        comment: '',
        subRows: expenseRows,
      },
      {
        id: buildBudgetingRowId({ rowType: 'typeGroup', isIncome: true }),
        rowType: 'typeGroup',
        name: t('income'),
        icon: null,
        categoryId: null,
        subcategoryId: null,
        isRestRow: false,
        isIncome: true,
        planSum: decimalSum(...incomeRows.map((r) => r.planSum)),
        comment: '',
        subRows: incomeRows,
      },
    ];
  }, [
    categories,
    forecasts,
    month,
    year,
    sortAllCategoriesById,
    sortSubcategories,
    t,
  ]);

  return {
    rows,
    isLoading: !categories || !forecasts,
  };
}
