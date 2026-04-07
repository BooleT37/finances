import { useQuery } from '@tanstack/react-query';
import Decimal from 'decimal.js';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getForecastsQueryOptions } from '~/features/budgeting/queries';
import type { Forecast } from '~/features/budgeting/schema';
import { findCategoryForecast } from '~/features/budgeting/utils/findCategoryForecast';
import { findSubcategoryForecast } from '~/features/budgeting/utils/findSubcategoryForecast';
import { TransactionActuals } from '~/features/budgeting/utils/TransactionActuals';
import {
  useSortAllCategoriesById,
  useSortSubcategories,
} from '~/features/categories/facets/categoriesOrder';
import { getCategoriesQueryOptions } from '~/features/categories/queries';
import type { Category } from '~/features/categories/schema';
import { getTransactionsQueryOptions } from '~/features/transactions/queries';
import { decimalSum } from '~/shared/utils/decimalSum';

import { buildBudgetingRowId } from './budgetingRowId';
import type { BudgetingRow } from './BudgetingTable.types';
import { REST_SUBCATEGORY_ID } from './constants';

const ZERO = new Decimal(0);

function buildCategoryRows(
  categories: Category[],
  forecasts: Forecast[],
  ta: TransactionActuals,
  month: number,
  year: number,
  lastMonth: number,
  lastYear: number,
  restSubcategoryName: string,
  sortSubcategories: (
    categoryId: number,
    sub1Id: number | null,
    sub2Id: number | null,
  ) => number,
): BudgetingRow[] {
  const thisMonthActuals = ta.matrix.getMonthActuals(month, year);
  const lastMonthActuals = ta.matrix.getMonthActuals(lastMonth, lastYear);

  return categories.map((category) => {
    const catForecast = findCategoryForecast(forecasts, {
      categoryId: category.id,
      month,
      year,
    });
    const categoryPlanSum = catForecast?.sum ?? ZERO;

    if (category.subcategories.length === 0) {
      const rowId = buildBudgetingRowId({
        rowType: 'category',
        categoryId: category.id,
      });
      const { average, monthCount } = ta.averages.getCategoryTotal(category.id);

      return {
        id: rowId,
        rowType: 'category',
        name: category.name,
        icon: category.icon,
        categoryId: category.id,
        subcategoryId: null,
        isRestRow: false,
        isIncome: category.isIncome,
        isContinuous: category.isContinuous,
        planSum: categoryPlanSum,
        comment: catForecast?.comment ?? '',
        thisMonthActual: thisMonthActuals.getCategoryTotal(category.id),
        lastMonthActual: lastMonthActuals.getCategoryTotal(category.id),
        average,
        monthCount,
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
        const subPlanSum = subForecast?.sum ?? ZERO;
        const subRowId = buildBudgetingRowId({
          rowType: 'subcategory',
          categoryId: category.id,
          subcategoryId: sub.id,
        });
        const { average, monthCount } = ta.averages.getSubcategoryTotal(
          category.id,
          sub.id,
        );

        return {
          id: subRowId,
          rowType: 'subcategory',
          name: sub.name,
          icon: null,
          categoryId: category.id,
          subcategoryId: sub.id,
          isRestRow: false,
          isIncome: category.isIncome,
          isContinuous: category.isContinuous,
          planSum: subPlanSum,
          comment: subForecast?.comment ?? '',
          thisMonthActual: thisMonthActuals.getSubcategoryTotal(
            category.id,
            sub.id,
          ),
          lastMonthActual: lastMonthActuals.getSubcategoryTotal(
            category.id,
            sub.id,
          ),
          average,
          monthCount,
        } satisfies BudgetingRow;
      },
    );

    subcategoryRows.sort((a, b) =>
      sortSubcategories(category.id, a.subcategoryId, b.subcategoryId),
    );

    const subcategorySum = decimalSum(...subcategoryRows.map((r) => r.planSum));
    const restPlanSum = categoryPlanSum;

    const restRowId = buildBudgetingRowId({
      rowType: 'rest',
      categoryId: category.id,
    });
    const { average: restAverage, monthCount: restMonthCount } =
      ta.averages.getSubcategoryTotal(category.id, null);

    const subRows: BudgetingRow[] = [
      ...subcategoryRows,
      {
        id: restRowId,
        rowType: 'subcategory',
        name: restSubcategoryName,
        icon: null,
        categoryId: category.id,
        subcategoryId: REST_SUBCATEGORY_ID,
        isRestRow: true,
        isIncome: category.isIncome,
        isContinuous: category.isContinuous,
        planSum: restPlanSum,
        comment: '',
        thisMonthActual: thisMonthActuals.getSubcategoryTotal(
          category.id,
          null,
        ),
        lastMonthActual: lastMonthActuals.getSubcategoryTotal(
          category.id,
          null,
        ),
        average: restAverage,
        monthCount: restMonthCount,
      },
    ];

    const fullPlan = subcategorySum.plus(restPlanSum);
    const catRowId = buildBudgetingRowId({
      rowType: 'category',
      categoryId: category.id,
    });
    const { average: catAverage, monthCount: catMonthCount } =
      ta.averages.getCategoryTotal(category.id);

    return {
      id: catRowId,
      rowType: 'category',
      name: category.name,
      icon: category.icon,
      categoryId: category.id,
      subcategoryId: null,
      isRestRow: false,
      isIncome: category.isIncome,
      isContinuous: category.isContinuous,
      planSum: fullPlan,
      comment: catForecast?.comment ?? '',
      thisMonthActual: thisMonthActuals.getCategoryTotal(category.id),
      lastMonthActual: lastMonthActuals.getCategoryTotal(category.id),
      average: catAverage,
      monthCount: catMonthCount,
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
  const { data: txCurrent } = useQuery(getTransactionsQueryOptions(year));
  const { data: txPrev } = useQuery(getTransactionsQueryOptions(year - 1));
  const sortAllCategoriesById = useSortAllCategoriesById();
  const sortSubcategories = useSortSubcategories();

  const rows = useMemo<BudgetingRow[] | undefined>(() => {
    if (!categories || !forecasts || !txCurrent || !txPrev) {
      return undefined;
    }

    const allTx = [...txCurrent, ...txPrev];
    const lastMonth = month === 0 ? 11 : month - 1;
    const lastYear = month === 0 ? year - 1 : year;

    const filtered = categories.filter((c) => c.type !== 'FROM_SAVINGS');
    const sorted = [...filtered].sort((a, b) =>
      sortAllCategoriesById(a.id, b.id),
    );

    const ta = new TransactionActuals(allTx, sorted);

    const expenseCategories = sorted.filter((c) => !c.isIncome);
    const incomeCategories = sorted.filter((c) => c.isIncome);
    const restSubcategoryName = t('restSubcategory');

    const expenseRows = buildCategoryRows(
      expenseCategories,
      forecasts,
      ta,
      month,
      year,
      lastMonth,
      lastYear,
      restSubcategoryName,
      sortSubcategories,
    );
    const incomeRows = buildCategoryRows(
      incomeCategories,
      forecasts,
      ta,
      month,
      year,
      lastMonth,
      lastYear,
      restSubcategoryName,
      sortSubcategories,
    );

    const thisMonthActuals = ta.matrix.getMonthActuals(month, year);
    const lastMonthActuals = ta.matrix.getMonthActuals(lastMonth, lastYear);
    const expenseAvg = ta.averages.getTotalExpenses();
    const incomeAvg = ta.averages.getTotalIncome();

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
        isContinuous: false,
        planSum: decimalSum(...expenseRows.map((r) => r.planSum)),
        comment: '',
        thisMonthActual: thisMonthActuals.getTotalExpenses(),
        lastMonthActual: lastMonthActuals.getTotalExpenses(),
        average: expenseAvg.average,
        monthCount: expenseAvg.monthCount,
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
        isContinuous: false,
        planSum: decimalSum(...incomeRows.map((r) => r.planSum)),
        comment: '',
        thisMonthActual: thisMonthActuals.getTotalIncome(),
        lastMonthActual: lastMonthActuals.getTotalIncome(),
        average: incomeAvg.average,
        monthCount: incomeAvg.monthCount,
        subRows: incomeRows,
      },
    ];
  }, [
    categories,
    forecasts,
    txCurrent,
    txPrev,
    month,
    year,
    sortAllCategoriesById,
    sortSubcategories,
    t,
  ]);

  return {
    rows,
    isLoading: !categories || !forecasts || !txCurrent || !txPrev,
  };
}
