import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useAtomValue } from 'jotai';

import {
  getCategoryMapQueryOptions,
  getSubcategoryMapQueryOptions,
} from '~/features/categories/queries';
import { getSourceMapQueryOptions } from '~/features/sources/queries';
import { useAvailableSubscriptions } from '~/features/subscriptions/useAvailableSubscriptions';
import { getTransactionsQueryOptions } from '~/features/transactions/queries';
import { getOrThrow } from '~/shared/getOrThrow';
import {
  selectedMonthAtom,
  selectedYearAtom,
  viewModeAtom,
} from '~/stores/month';

import { costWithoutComponents } from './costWithoutComponents';
import {
  type TransactionTableItem,
  UPCOMING_SUBSCRIPTION_ID,
} from './transactionTableItem';

function formatComponentName(
  componentName: string,
  parentName: string,
): string {
  // To be replaced with i18n keys in step 7.
  if (componentName && parentName)
    return `${componentName} (part of "${parentName}")`;
  if (componentName) return componentName;
  if (parentName) return `Part of "${parentName}"`;
  return '';
}

interface UseTransactionTableItemsOptions {
  showUpcoming: boolean;
  searchString: string;
}

export function useTransactionTableItems({
  showUpcoming,
  searchString,
}: UseTransactionTableItemsOptions): TransactionTableItem[] | undefined {
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
  const { data: subcategoryMap } = useQuery(getSubcategoryMapQueryOptions());
  const { data: sourceMap } = useQuery(getSourceMapQueryOptions());
  const availableSubscriptions = useAvailableSubscriptions(
    rangeStart,
    rangeEnd,
  );

  if (
    !transactions ||
    !categoryMap ||
    !subcategoryMap ||
    !sourceMap ||
    !availableSubscriptions
  )
    return undefined;

  const search = searchString.toLowerCase();

  const filtered = transactions.filter(
    (t) =>
      (viewMode !== 'month' || t.date.format('YYYY-MM') === selectedMonth) &&
      (!search || t.name.toLowerCase().includes(search.toLowerCase())),
  );

  const transactionRows: TransactionTableItem[] = filtered.map((t) => {
    const category = getOrThrow(categoryMap, t.categoryId, 'Category');
    const subcategory = t.subcategoryId
      ? getOrThrow(subcategoryMap, t.subcategoryId, 'Subcategory')
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
      date: t.date.toISOString(),
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
  });

  const subscriptionRows: TransactionTableItem[] = showUpcoming
    ? availableSubscriptions
        .filter(
          (a) => !search || a.subscription.name.toLowerCase().includes(search),
        )
        .map(({ subscription: s, firstDate }) => {
          const category = getOrThrow(categoryMap, s.categoryId, 'Category');
          const subcategory = s.subcategoryId
            ? getOrThrow(subcategoryMap, s.subcategoryId, 'Subcategory')
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
            date: firstDate.toISOString(),
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
        })
    : [];

  const componentRows: TransactionTableItem[] = filtered.flatMap((t) => {
    const parentCategory = getOrThrow(categoryMap, t.categoryId, 'Category');
    const source = t.sourceId
      ? getOrThrow(sourceMap, t.sourceId, 'Source')
      : null;

    return t.components.map((c) => ({
      id: c.id,
      name: formatComponentName(c.name, t.name),
      cost: {
        value: c.cost,
        isSubscription: false,
        isUpcomingSubscription: false,
        isIncome: c.category.isIncome,
        parentExpenseName: t.name,
      },
      date: t.date.toISOString(),
      category: c.category.name,
      categoryId: c.categoryId,
      categoryShortname: parentCategory.shortname,
      categoryIcon: c.category.icon,
      subcategory: c.subcategory?.name ?? null,
      subcategoryId: c.subcategoryId,
      source: source?.name ?? '',
      isUpcomingSubscription: false,
      expenseId: t.id,
      isIncome: c.category.isIncome,
      isContinuous: c.category.isContinuous,
    }));
  });

  return [...transactionRows, ...subscriptionRows, ...componentRows];
}
