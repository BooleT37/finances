import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useAtomValue } from 'jotai';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { getCategoryMapQueryOptions } from '~/features/categories/facets/categoryMap';
import type { Category } from '~/features/categories/schema';
import { getSourceMapQueryOptions } from '~/features/sources/facets/sourceMap';
import type { Source } from '~/features/sources/schema';
import type { AvailableSubscription } from '~/features/subscriptions/useAvailableSubscriptions';
import { useAvailableSubscriptions } from '~/features/subscriptions/useAvailableSubscriptions';
import { getTransactionsQueryOptions } from '~/features/transactions/queries';
import { DATE_FORMAT } from '~/shared/constants';
import { findByIdOrThrow, getOrThrow } from '~/shared/utils/getOrThrow';
import {
  selectedMonthAtom,
  selectedYearAtom,
  viewModeAtom,
} from '~/stores/month';

import { costWithoutComponents } from './costWithoutComponents';
import type { Transaction } from './schema';
import {
  type TransactionTableItem,
  UPCOMING_SUBSCRIPTION_ID,
} from './transactionTableItem';

type CategoryMap = Record<string, Category>;
type SourceMap = Record<string, Source>;

// #region Mapping functions

function mapTransaction(
  t: Transaction,
  categoryMap: CategoryMap,
  sourceMap: SourceMap,
): TransactionTableItem {
  const category = getOrThrow(categoryMap, t.categoryId, 'Category');
  const subcategory =
    t.subcategoryId !== null
      ? findByIdOrThrow(category.subcategories, t.subcategoryId, 'Subcategory')
      : null;
  const source = t.sourceId
    ? getOrThrow(sourceMap, t.sourceId, 'Source')
    : null;

  return {
    id: t.id,
    name: t.name,
    cost: {
      value: costWithoutComponents(t.cost, t.components),
      isSubscription: t.subscriptionId !== null,
      isIncome: category.isIncome,
      costWithComponents: t.components.length > 0 ? t.cost : undefined,
    },
    date: t.date.format(DATE_FORMAT),
    category: category.name,
    categoryId: t.categoryId,
    categoryShortname: category.shortname,
    categoryIcon: category.icon,
    subcategory: subcategory?.name ?? null,
    subcategoryId: t.subcategoryId,
    source: source?.name ?? '',
    isUpcomingSubscription: false,
    expenseId: null,
    isIncome: category.isIncome,
    isContinuous: category.isContinuous,
  };
}

function mapSubscription(
  { subscription: s, firstDate }: AvailableSubscription,
  categoryMap: CategoryMap,
  sourceMap: SourceMap,
): TransactionTableItem {
  const category = getOrThrow(categoryMap, s.categoryId, 'Category');
  const subcategory =
    s.subcategoryId !== null
      ? findByIdOrThrow(category.subcategories, s.subcategoryId, 'Subcategory')
      : null;
  const source = s.sourceId
    ? getOrThrow(sourceMap, s.sourceId, 'Source')
    : null;

  return {
    id: UPCOMING_SUBSCRIPTION_ID,
    name: s.name,
    cost: {
      value: s.cost,
      isSubscription: true,
      isUpcomingSubscription: true,
      isIncome: category.isIncome,
    },
    date: firstDate.format(DATE_FORMAT),
    category: category.name,
    categoryId: s.categoryId,
    categoryShortname: category.shortname,
    categoryIcon: category.icon,
    subcategory: subcategory?.name ?? null,
    subcategoryId: s.subcategoryId,
    source: source?.name ?? '',
    isUpcomingSubscription: true,
    expenseId: null,
    isIncome: category.isIncome,
    isContinuous: category.isContinuous,
  };
}

function useMapComponents() {
  const { t: i18n } = useTranslation('transactions');

  return useCallback(
    (
      t: Transaction,
      categoryMap: CategoryMap,
      sourceMap: SourceMap,
    ): TransactionTableItem[] => {
      const parentCategory = getOrThrow(categoryMap, t.categoryId, 'Category');
      const source = t.sourceId
        ? getOrThrow(sourceMap, t.sourceId, 'Source')
        : null;

      return t.components.map((c) => {
        const category = getOrThrow(categoryMap, c.categoryId, 'Category');
        const subcategory =
          c.subcategoryId !== null
            ? findByIdOrThrow(
                category.subcategories,
                c.subcategoryId,
                'Subcategory',
              )
            : null;

        let name: string;
        if (c.name && t.name) {
          name = i18n('componentWithParent', {
            componentName: c.name,
            parentName: t.name,
          });
        } else if (c.name) {
          name = c.name;
        } else if (t.name) {
          name = i18n('componentOfExpense', { name: t.name });
        } else {
          name = '';
        }

        return {
          id: c.id,
          name,
          cost: {
            value: c.cost,
            isSubscription: false,
            isUpcomingSubscription: false,
            isIncome: category.isIncome,
            parentExpenseName: t.name,
          },
          date: t.date.format(DATE_FORMAT),
          category: category.name,
          categoryId: c.categoryId,
          categoryShortname: parentCategory.shortname,
          categoryIcon: category.icon,
          subcategory: subcategory?.name ?? null,
          subcategoryId: c.subcategoryId,
          source: source?.name ?? '',
          isUpcomingSubscription: false,
          expenseId: t.id,
          isIncome: category.isIncome,
          isContinuous: category.isContinuous,
        };
      });
    },
    [i18n],
  );
}

// #endregion

// #region Hook

interface UseTransactionTableItemsOptions {
  showUpcoming: boolean;
  searchString: string;
}

export function useTransactionTableItems({
  showUpcoming,
  searchString,
}: UseTransactionTableItemsOptions): TransactionTableItem[] | undefined {
  const mapComponents = useMapComponents();
  const selectedMonth = useAtomValue(selectedMonthAtom); // 'YYYY-MM'
  const year = useAtomValue(selectedYearAtom);
  const viewMode = useAtomValue(viewModeAtom); // 'month' | 'year'

  const monthStart = dayjs(selectedMonth);
  const rangeStart =
    viewMode === 'month'
      ? monthStart.startOf('month')
      : monthStart.startOf('year');
  const rangeEnd =
    viewMode === 'month' ? monthStart.endOf('month') : monthStart.endOf('year');

  const { data: transactions } = useQuery(getTransactionsQueryOptions(year));
  const { data: categoryMap } = useQuery(getCategoryMapQueryOptions());
  const { data: sourceMap } = useQuery(getSourceMapQueryOptions());
  const availableSubscriptions = useAvailableSubscriptions(
    rangeStart,
    rangeEnd,
  );

  if (!transactions || !categoryMap || !sourceMap || !availableSubscriptions)
    return undefined;

  const search = searchString.toLowerCase();

  const filtered = transactions.filter(
    (t) =>
      (viewMode !== 'month' || t.date.format('YYYY-MM') === selectedMonth) &&
      (!search || t.name.toLowerCase().includes(search)),
  );

  const transactionRows = filtered.map((t) =>
    mapTransaction(t, categoryMap, sourceMap),
  );

  const subscriptionRows = showUpcoming
    ? availableSubscriptions
        .filter(
          (a) => !search || a.subscription.name.toLowerCase().includes(search),
        )
        .map((a) => mapSubscription(a, categoryMap, sourceMap))
    : [];

  const componentRows = filtered.flatMap((t) =>
    mapComponents(t, categoryMap, sourceMap),
  );

  return [...transactionRows, ...subscriptionRows, ...componentRows];
}

// #endregion
