import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';

import { getTransactionsQueryOptions } from '~/features/transactions/queries';
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

  if (!transactions) return undefined;

  const filtered =
    viewMode === 'month'
      ? transactions.filter(
          (t) => t.date.toISOString().slice(0, 7) === selectedMonth,
        )
      : transactions;

  const transactionRows: TransactionTableItem[] = filtered.map((t) => ({
    id: t.id,
    name: t.name,
    cost: {
      value: t.cost, // Decimal from decimalCodec
      isSubscription: t.subscriptionId !== null,
      costWithComponents: t.components.length > 0 ? t.cost : undefined,
    },
    date: t.date.toISOString(), // Date → ISO string
    category: t.category.name,
    categoryId: t.categoryId,
    categoryShortname: t.category.shortname,
    categoryIcon: t.category.icon,
    subcategory: t.subcategory?.name ?? null,
    subcategoryId: t.subcategoryId,
    source: t.source?.name ?? '',
    isUpcomingSubscription: false,
    expenseId: null,
    isIncome: t.category.isIncome,
    isContinuous: t.category.isContinuous,
  }));

  const componentRows: TransactionTableItem[] = filtered.flatMap((t) =>
    t.components.map((c) => ({
      id: c.id,
      name: formatComponentName(c.name, t.name),
      cost: {
        value: c.cost, // Decimal from decimalCodec
        isSubscription: false,
        isUpcomingSubscription: false,
        parentExpenseName: t.name,
      },
      date: t.date.toISOString(), // inherited from parent
      category: c.category.name,
      categoryId: c.categoryId,
      categoryShortname: t.category.shortname, // inherited from parent (per original)
      categoryIcon: c.category.icon,
      subcategory: c.subcategory?.name ?? null,
      subcategoryId: c.subcategoryId,
      source: t.source?.name ?? '', // inherited from parent
      isUpcomingSubscription: false,
      expenseId: t.id,
      isIncome: c.category.isIncome,
      isContinuous: c.category.isContinuous,
    })),
  );

  return [...transactionRows, ...componentRows];
}
