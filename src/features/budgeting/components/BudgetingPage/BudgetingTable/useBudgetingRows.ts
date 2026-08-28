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
import {
  buildCategoryFillPlans,
  buildSubcategoriesFillPlans,
  mergeFillPlans,
} from './fillPlans';

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

    if (category.subcategories.length === 0) {
      const rowId = buildBudgetingRowId({
        rowType: 'category',
        categoryId: category.id,
      });
      const { average, monthCount } = ta.averages.getCategoryTotal(category.id);
      const ownSubs = subscriptions.filter(
        (s) =>
          s.subscription.categoryId === category.id &&
          s.subscription.subcategoryId === null,
      );

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
        subscriptions: {
          list: ownSubs,
          plans: buildCategoryFillPlans(category.id, ownSubs),
        },
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
        const subSubs = subscriptions.filter(
          (s) =>
            s.subscription.categoryId === category.id &&
            s.subscription.subcategoryId === sub.id,
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
          subscriptions: {
            list: subSubs,
            plans: buildSubcategoriesFillPlans(category.id, [
              { subcategoryId: sub.id, subs: subSubs },
            ]),
          },
        } satisfies BudgetingRow;
      },
    );

    subcategoryRows.sort((a, b) =>
      sortSubcategories(category.id, a.subcategoryId, b.subcategoryId),
    );

    const subcategorySum = decimalSum(...subcategoryRows.map((r) => r.planSum));
    const restForecast = findSubcategoryForecast(forecasts, {
      categoryId: category.id,
      subcategoryId: null,
      month,
      year,
    });
    const restPlanSum = restForecast
      ? restForecast.sum
      : categoryPlanSum.minus(subcategorySum);

    const restRowId = buildBudgetingRowId({
      rowType: 'rest',
      categoryId: category.id,
    });
    const { average: restAverage, monthCount: restMonthCount } =
      ta.averages.getSubcategoryTotal(category.id, null);
    const restSubs = subscriptions.filter(
      (s) =>
        s.subscription.categoryId === category.id &&
        s.subscription.subcategoryId === null,
    );

    const subRows: BudgetingRow[] = [
      ...subcategoryRows,
      {
        id: restRowId,
        rowType: 'subcategory',
        name: restSubcategoryName,
        icon: null,
        categoryId: category.id,
        subcategoryId: null,
        isRestRow: true,
        isIncome: category.isIncome,
        isContinuous: category.isContinuous,
        planSum: restPlanSum,
        comment: restForecast?.comment ?? '',
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
        subscriptions: {
          list: restSubs,
          plans: buildSubcategoriesFillPlans(category.id, [
            { subcategoryId: null, subs: restSubs },
          ]),
        },
      },
    ];

    const catRowId = buildBudgetingRowId({
      rowType: 'category',
      categoryId: category.id,
    });
    const { average: catAverage, monthCount: catMonthCount } =
      ta.averages.getCategoryTotal(category.id);
    const categorySubs = subscriptions.filter(
      (s) => s.subscription.categoryId === category.id,
    );

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
      comment: catForecast?.comment ?? '',
      thisMonthActual: thisMonthActuals.getCategoryTotal(category.id),
      lastMonthActual: lastMonthActuals.getCategoryTotal(category.id),
      average: catAverage,
      monthCount: catMonthCount,
      subscriptions: {
        list: categorySubs,
        plans: buildSubcategoriesFillPlans(
          category.id,
          subRows.map((child) => ({
            subcategoryId: child.isRestRow ? null : child.subcategoryId,
            subs: child.subscriptions.list,
          })),
        ),
      },
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
      !txCurrent ||
      !txPrev ||
      !isCategoriesOrderLoaded
    ) {
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

    const expenseCategoryIds = new Set(expenseCategories.map((c) => c.id));
    const savingsCategoryIds = new Set(savingsCategories.map((c) => c.id));
    const incomeCategoryIds = new Set(incomeCategories.map((c) => c.id));

    const expenseSubs = resolvedSubscriptions.filter((s) =>
      expenseCategoryIds.has(s.subscription.categoryId),
    );
    const savingsSubs = resolvedSubscriptions.filter((s) =>
      savingsCategoryIds.has(s.subscription.categoryId),
    );
    const incomeSubs = resolvedSubscriptions.filter((s) =>
      incomeCategoryIds.has(s.subscription.categoryId),
    );

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
        comment: '',
        thisMonthActual: thisMonthActuals.getTotalExpenses(),
        lastMonthActual: lastMonthActuals.getTotalExpenses(),
        average: expenseAvg.average,
        monthCount: expenseAvg.monthCount,
        subscriptions: {
          list: expenseSubs,
          plans: mergeFillPlans(expenseRows.map((r) => r.subscriptions.plans)),
        },
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
        comment: '',
        thisMonthActual: thisMonthActuals.getTotalSavings(),
        lastMonthActual: lastMonthActuals.getTotalSavings(),
        average: savingsAvg.average,
        monthCount: savingsAvg.monthCount,
        subscriptions: {
          list: savingsSubs,
          plans: mergeFillPlans(savingsRows.map((r) => r.subscriptions.plans)),
        },
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
        comment: '',
        thisMonthActual: thisMonthActuals.getTotalIncome(),
        lastMonthActual: lastMonthActuals.getTotalIncome(),
        average: incomeAvg.average,
        monthCount: incomeAvg.monthCount,
        subscriptions: {
          list: incomeSubs,
          plans: mergeFillPlans(incomeRows.map((r) => r.subscriptions.plans)),
        },
        subRows: incomeRows,
      },
    ];

    const grandTotal: BudgetingGrandTotal = {
      thisMonthActual: thisMonthActuals.getTotal(),
      lastMonthActual: lastMonthActuals.getTotal(),
      average: totalAvg.average,
      monthCount: totalAvg.monthCount,
      planSum: expensePlanSum.plus(savingsPlanSum).plus(incomePlanSum),
      subscriptions: {
        list: resolvedSubscriptions,
        plans: mergeFillPlans(rows.map((r) => r.subscriptions.plans)),
      },
    };

    return { rows, grandTotal };
  }, [
    categories,
    forecasts,
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
    isLoading: !categories || !forecasts || !txCurrent || !txPrev,
  };
}
