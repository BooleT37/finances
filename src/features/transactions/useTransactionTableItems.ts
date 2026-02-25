import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';

import {
  getCategoryMapQueryOptions,
  getSubcategoryMapQueryOptions,
} from '~/features/categories/queries';
import { getSourceMapQueryOptions } from '~/features/sources/queries';
import { getTransactionsQueryOptions } from '~/features/transactions/queries';
import { getOrThrow } from '~/shared/getOrThrow';
import {
  selectedMonthAtom,
  selectedYearAtom,
  viewModeAtom,
} from '~/stores/month';

import type { TransactionTableItem } from './transactionTableItem';

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

export function useTransactionTableItems(): TransactionTableItem[] | undefined {
  const selectedMonth = useAtomValue(selectedMonthAtom); // 'YYYY-MM'
  const year = useAtomValue(selectedYearAtom);
  const viewMode = useAtomValue(viewModeAtom); // 'month' | 'year'

  const { data: transactions } = useQuery(getTransactionsQueryOptions(year));
  const { data: categoryMap } = useQuery(getCategoryMapQueryOptions());
  const { data: subcategoryMap } = useQuery(getSubcategoryMapQueryOptions());
  const { data: sourceMap } = useQuery(getSourceMapQueryOptions());

  if (!transactions || !categoryMap || !subcategoryMap || !sourceMap)
    return undefined;

  const filtered =
    viewMode === 'month'
      ? transactions.filter(
          (t) => t.date.toISOString().slice(0, 7) === selectedMonth,
        )
      : transactions;

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
        value: t.cost,
        isSubscription: t.subscriptionId !== null,
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

  return [...transactionRows, ...componentRows];
}
