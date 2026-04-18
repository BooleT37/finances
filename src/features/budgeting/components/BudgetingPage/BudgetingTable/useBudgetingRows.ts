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
import type { AvailableSubscription } from '~/features/subscriptions/facets/availableSubscriptions';
import { useAvailableSubscriptions } from '~/features/subscriptions/facets/availableSubscriptions';
import { getTransactionsQueryOptions } from '~/features/transactions/queries';
import { decimalSum } from '~/shared/utils/decimalSum';

import { buildBudgetingRowId } from './budgetingRowId';
import type { BudgetingGrandTotal, BudgetingRow } from './BudgetingTable.types';
import { REST_SUBCATEGORY_ID } from './constants';

const ZERO = new Decimal(0);

function buildCategoryRows(
  categories: Category[],
  forecasts: Forecast[],
  allForecasts: Forecast[],
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
  subscriptions: AvailableSubscription[],
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

    const lastMonthCategoryPlanSum =
      findCategoryForecast(allForecasts, {
        categoryId: category.id,
        month: lastMonth,
        year: lastYear,
      })?.sum ?? ZERO;

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
        lastMonthPlanSum: lastMonthCategoryPlanSum,
        comment: catForecast?.comment ?? '',
        thisMonthActual: thisMonthActuals.getCategoryTotal(category.id),
        lastMonthActual: lastMonthActuals.getCategoryTotal(category.id),
        average,
        monthCount,
        subscriptions: subscriptions.filter(
          (s) =>
            s.subscription.categoryId === category.id &&
            s.subscription.subcategoryId === null,
        ),
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
        const lastMonthSubPlanSum =
          findSubcategoryForecast(allForecasts, {
            categoryId: category.id,
            subcategoryId: sub.id,
            month: lastMonth,
            year: lastYear,
          })?.sum ?? ZERO;
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
          lastMonthPlanSum: lastMonthSubPlanSum,
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
          subscriptions: subscriptions.filter(
            (s) =>
              s.subscription.categoryId === category.id &&
              s.subscription.subcategoryId === sub.id,
          ),
        } satisfies BudgetingRow;
      },
    );

    subcategoryRows.sort((a, b) =>
      sortSubcategories(category.id, a.subcategoryId, b.subcategoryId),
    );

    const subcategorySum = decimalSum(...subcategoryRows.map((r) => r.planSum));
    const restPlanSum = categoryPlanSum.minus(subcategorySum);

    const lastMonthSubcategorySum = decimalSum(
      ...subcategoryRows.map((r) => r.lastMonthPlanSum),
    );
    const lastMonthRestPlanSum = lastMonthCategoryPlanSum.minus(
      lastMonthSubcategorySum,
    );

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
        lastMonthPlanSum: lastMonthRestPlanSum,
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
        subscriptions: subscriptions.filter(
          (s) =>
            s.subscription.categoryId === category.id &&
            s.subscription.subcategoryId === null,
        ),
      },
    ];

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
      planSum: categoryPlanSum,
      lastMonthPlanSum: lastMonthCategoryPlanSum,
      comment: catForecast?.comment ?? '',
      thisMonthActual: thisMonthActuals.getCategoryTotal(category.id),
      lastMonthActual: lastMonthActuals.getCategoryTotal(category.id),
      average: catAverage,
      monthCount: catMonthCount,
      subscriptions: subscriptions.filter(
        (s) => s.subscription.categoryId === category.id,
      ),
      subRows,
    } satisfies BudgetingRow;
  });
}

export function useBudgetingRows(
  month: number,
  year: number,
): {
  rows: BudgetingRow[] | undefined;
  grandTotal: BudgetingGrandTotal | undefined;
  isLoading: boolean;
} {
  const { t } = useTranslation('budgeting');
  const { data: categories } = useQuery(getCategoriesQueryOptions());
  const { data: forecasts } = useQuery(getForecastsQueryOptions(year));
  const { data: prevYearForecasts } = useQuery(
    getForecastsQueryOptions(year - 1),
  );
  const { data: txCurrent } = useQuery(getTransactionsQueryOptions(year));
  const { data: txPrev } = useQuery(getTransactionsQueryOptions(year - 1));
  const { sortAllCategoriesById, isSuccess: isCategoriesOrderLoaded } =
    useSortAllCategoriesById();
  const sortSubcategories = useSortSubcategories();
  const subscriptions = useAvailableSubscriptions();

  const result = useMemo<
    { rows: BudgetingRow[]; grandTotal: BudgetingGrandTotal } | undefined
  >(() => {
    if (
      !categories ||
      !forecasts ||
      !prevYearForecasts ||
      !txCurrent ||
      !txPrev ||
      !isCategoriesOrderLoaded
    ) {
      return undefined;
    }

    const allTx = [...txCurrent, ...txPrev];
    const lastMonth = month === 0 ? 11 : month - 1;
    const lastYear = month === 0 ? year - 1 : year;
    // When lastYear === year, forecasts already covers last month; no need to merge.
    const allForecasts =
      lastYear === year ? forecasts : [...forecasts, ...prevYearForecasts];

    const filtered = categories.filter((c) => c.type !== 'FROM_SAVINGS');
    const sorted = [...filtered].sort((a, b) =>
      sortAllCategoriesById(a.id, b.id),
    );

    const ta = new TransactionActuals(allTx, sorted);

    const expenseCategories = sorted.filter(
      (c) => !c.isIncome && c.type !== 'TO_SAVINGS',
    );
    const incomeCategories = sorted.filter((c) => c.isIncome);
    const savingsCategories = sorted.filter((c) => c.type === 'TO_SAVINGS');
    const restSubcategoryName = t('restSubcategory');
    const resolvedSubscriptions = subscriptions ?? [];

    const expenseRows = buildCategoryRows(
      expenseCategories,
      forecasts,
      allForecasts,
      ta,
      month,
      year,
      lastMonth,
      lastYear,
      restSubcategoryName,
      sortSubcategories,
      resolvedSubscriptions,
    );
    const incomeRows = buildCategoryRows(
      incomeCategories,
      forecasts,
      allForecasts,
      ta,
      month,
      year,
      lastMonth,
      lastYear,
      restSubcategoryName,
      sortSubcategories,
      resolvedSubscriptions,
    );
    const savingsRows = buildCategoryRows(
      savingsCategories,
      forecasts,
      allForecasts,
      ta,
      month,
      year,
      lastMonth,
      lastYear,
      restSubcategoryName,
      sortSubcategories,
      resolvedSubscriptions,
    );

    const thisMonthActuals = ta.matrix.getMonthActuals(month, year);
    const lastMonthActuals = ta.matrix.getMonthActuals(lastMonth, lastYear);
    const expenseAvg = ta.averages.getTotalExpenses();
    const incomeAvg = ta.averages.getTotalIncome();
    const savingsAvg = ta.averages.getTotalSavings();
    const totalAvg = ta.averages.getTotal();

    const expensePlanSum = decimalSum(...expenseRows.map((r) => r.planSum));
    const savingsPlanSum = decimalSum(...savingsRows.map((r) => r.planSum));
    const incomePlanSum = decimalSum(...incomeRows.map((r) => r.planSum));
    const expenseLastMonthPlanSum = decimalSum(
      ...expenseRows.map((r) => r.lastMonthPlanSum),
    );
    const savingsLastMonthPlanSum = decimalSum(
      ...savingsRows.map((r) => r.lastMonthPlanSum),
    );
    const incomeLastMonthPlanSum = decimalSum(
      ...incomeRows.map((r) => r.lastMonthPlanSum),
    );

    const expenseCategoryIds = new Set(expenseCategories.map((c) => c.id));
    const savingsCategoryIds = new Set(savingsCategories.map((c) => c.id));
    const incomeCategoryIds = new Set(incomeCategories.map((c) => c.id));

    const rows: BudgetingRow[] = [
      {
        id: buildBudgetingRowId({ rowType: 'typeGroup', group: 'expense' }),
        rowType: 'typeGroup',
        name: t('expenses'),
        icon: null,
        categoryId: null,
        subcategoryId: null,
        isRestRow: false,
        isIncome: false,
        isContinuous: false,
        planSum: expensePlanSum,
        lastMonthPlanSum: expenseLastMonthPlanSum,
        comment: '',
        thisMonthActual: thisMonthActuals.getTotalExpenses(),
        lastMonthActual: lastMonthActuals.getTotalExpenses(),
        average: expenseAvg.average,
        monthCount: expenseAvg.monthCount,
        subscriptions: resolvedSubscriptions.filter((s) =>
          expenseCategoryIds.has(s.subscription.categoryId),
        ),
        subRows: expenseRows,
      },
      {
        id: buildBudgetingRowId({ rowType: 'typeGroup', group: 'savings' }),
        rowType: 'typeGroup',
        name: t('savings'),
        icon: null,
        categoryId: null,
        subcategoryId: null,
        isRestRow: false,
        isIncome: false,
        isContinuous: false,
        planSum: savingsPlanSum,
        lastMonthPlanSum: savingsLastMonthPlanSum,
        comment: '',
        thisMonthActual: thisMonthActuals.getTotalSavings(),
        lastMonthActual: lastMonthActuals.getTotalSavings(),
        average: savingsAvg.average,
        monthCount: savingsAvg.monthCount,
        subscriptions: resolvedSubscriptions.filter((s) =>
          savingsCategoryIds.has(s.subscription.categoryId),
        ),
        subRows: savingsRows,
      },
      {
        id: buildBudgetingRowId({ rowType: 'typeGroup', group: 'income' }),
        rowType: 'typeGroup',
        name: t('income'),
        icon: null,
        categoryId: null,
        subcategoryId: null,
        isRestRow: false,
        isIncome: true,
        isContinuous: false,
        planSum: incomePlanSum,
        lastMonthPlanSum: incomeLastMonthPlanSum,
        comment: '',
        thisMonthActual: thisMonthActuals.getTotalIncome(),
        lastMonthActual: lastMonthActuals.getTotalIncome(),
        average: incomeAvg.average,
        monthCount: incomeAvg.monthCount,
        subscriptions: resolvedSubscriptions.filter((s) =>
          incomeCategoryIds.has(s.subscription.categoryId),
        ),
        subRows: incomeRows,
      },
    ];

    const grandTotal: BudgetingGrandTotal = {
      thisMonthActual: thisMonthActuals.getTotal(),
      lastMonthActual: lastMonthActuals.getTotal(),
      average: totalAvg.average,
      monthCount: totalAvg.monthCount,
      planSum: expensePlanSum.plus(savingsPlanSum).plus(incomePlanSum),
      lastMonthPlanSum: expenseLastMonthPlanSum
        .plus(savingsLastMonthPlanSum)
        .plus(incomeLastMonthPlanSum),
      subscriptions: resolvedSubscriptions,
    };

    return { rows, grandTotal };
  }, [
    categories,
    forecasts,
    prevYearForecasts,
    txCurrent,
    txPrev,
    isCategoriesOrderLoaded,
    month,
    year,
    t,
    subscriptions,
    sortSubcategories,
    sortAllCategoriesById,
  ]);

  return {
    rows: result?.rows,
    grandTotal: result?.grandTotal,
    isLoading:
      !categories || !forecasts || !prevYearForecasts || !txCurrent || !txPrev,
  };
}
