import { useQuery } from '@tanstack/react-query';
import type Decimal from 'decimal.js';
import { useAtomValue } from 'jotai';
import { useCallback } from 'react';

import { getCategoryMapQueryOptions } from '~/features/categories/facets/categoryMap';
import type { Category } from '~/features/categories/schema';
import { getSavingSpendingCategoryMapQueryOptions } from '~/features/savingSpendings/facets/savingSpendingCategoryMap';
import { getSavingSpendingMapQueryOptions } from '~/features/savingSpendings/facets/savingSpendingMap';
import type {
  SavingSpending,
  SavingSpendingCategory,
} from '~/features/savingSpendings/schema';
import { getSourceMapQueryOptions } from '~/features/sources/facets/sourceMap';
import type { Source } from '~/features/sources/schema';
import type { AvailableSubscription } from '~/features/subscriptions/facets/availableSubscriptions';
import { useAvailableSubscriptions } from '~/features/subscriptions/facets/availableSubscriptions';
import { getTransactionsQueryOptions } from '~/features/transactions/queries';
import { DATE_FORMAT } from '~/shared/constants';
import { findByIdOrThrow, getOrThrow } from '~/shared/utils/getOrThrow';
import {
  selectedMonthKeyAtom,
  selectedYearAtom,
  viewModeAtom,
} from '~/stores/month';

import type { Transaction } from '../../schema';
import { costWithoutComponents } from '../../utils/costWithoutComponents';
import { matchesCostQuery } from '../../utils/matchesCostQuery';
import { useFormatComponentName } from '../../utils/useFormatComponentName';
import {
  type TransactionTableItem,
  UPCOMING_SUBSCRIPTION_ID,
} from '../TransactionsTable/TransactionsTable.types';

type CategoryMap = Record<string, Category>;
type SourceMap = Record<string, Source>;
type SavingSpendingMap = Record<string, SavingSpending>;
type SavingSpendingCategoryMap = Record<string, SavingSpendingCategory>;

function matchesNameOrCost(
  name: string,
  cost: Decimal,
  search: string,
): boolean {
  return (
    !search ||
    name.toLowerCase().includes(search) ||
    matchesCostQuery(cost, search)
  );
}

// #region Mapping functions

function tableDataName(
  tx: Transaction,
  savingSpendingCategoryMap: SavingSpendingCategoryMap,
  savingSpendingMap: SavingSpendingMap,
): string {
  if (tx.savingSpendingCategoryId !== null) {
    const cat = getOrThrow(
      savingSpendingCategoryMap,
      tx.savingSpendingCategoryId,
      'SavingSpendingCategory',
    );
    if (cat.savingSpendingId !== null) {
      const spending = getOrThrow(
        savingSpendingMap,
        cat.savingSpendingId,
        'SavingSpending',
      );
      const savingSpendingInfo = cat.name
        ? `${spending.name} - ${cat.name}`
        : spending.name;
      return tx.name
        ? `${savingSpendingInfo} (${tx.name})`
        : savingSpendingInfo;
    }
  }
  return tx.name;
}

function mapTransaction(
  tx: Transaction,
  categoryMap: CategoryMap,
  sourceMap: SourceMap,
  savingSpendingCategoryMap: SavingSpendingCategoryMap,
  savingSpendingMap: SavingSpendingMap,
): TransactionTableItem {
  const category = getOrThrow(categoryMap, tx.categoryId, 'Category');
  const source =
    tx.sourceId !== null ? getOrThrow(sourceMap, tx.sourceId, 'Source') : null;

  let subcategoryName: string | null = null;
  let subcategoryId: number | null = null;

  if (
    category.type === 'FROM_SAVINGS' &&
    tx.savingSpendingCategoryId !== null
  ) {
    const savingSpendingCat = getOrThrow(
      savingSpendingCategoryMap,
      tx.savingSpendingCategoryId,
      'SavingSpendingCategory',
    );
    if (savingSpendingCat.savingSpendingId !== null) {
      const saving = getOrThrow(
        savingSpendingMap,
        savingSpendingCat.savingSpendingId,
        'SavingSpending',
      );
      subcategoryName = saving.name;
      subcategoryId = savingSpendingCat.savingSpendingId;
    }
  } else if (tx.subcategoryId !== null) {
    const sub = findByIdOrThrow(
      category.subcategories,
      tx.subcategoryId,
      'Subcategory',
    );
    subcategoryName = sub.name;
    subcategoryId = tx.subcategoryId;
  }

  return {
    id: tx.id,
    name: tableDataName(tx, savingSpendingCategoryMap, savingSpendingMap),
    rawName: tx.name,
    cost: {
      cost: costWithoutComponents(tx.cost, tx.components),
      isSubscription: tx.subscriptionId !== null,
      isIncome: category.isIncome,
      costWithComponents: tx.components.length > 0 ? tx.cost : undefined,
    },
    date: tx.date.format(DATE_FORMAT),
    category: category.name,
    categoryId: tx.categoryId,
    categoryShortname: category.shortname,
    categoryIcon: category.icon,
    subcategory: subcategoryName,
    subcategoryId,
    source: source?.name ?? '',
    sourceId: tx.sourceId ?? null,
    subscriptionId: null,
    isUpcomingSubscription: false,
    isFromSavings: category.type === 'FROM_SAVINGS',
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
  const source =
    s.sourceId !== null ? getOrThrow(sourceMap, s.sourceId, 'Source') : null;

  return {
    id: UPCOMING_SUBSCRIPTION_ID,
    name: s.name,
    rawName: s.name,
    cost: {
      cost: s.cost,
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
    sourceId: s.sourceId ?? null,
    subscriptionId: s.id,
    isUpcomingSubscription: true,
    isFromSavings: false,
    expenseId: null,
    isIncome: category.isIncome,
    isContinuous: category.isContinuous,
  };
}

function useMapComponents() {
  const formatComponentName = useFormatComponentName();

  return useCallback(
    (
      tx: Transaction,
      categoryMap: CategoryMap,
      sourceMap: SourceMap,
    ): TransactionTableItem[] => {
      const parentCategory = getOrThrow(categoryMap, tx.categoryId, 'Category');
      const source = tx.sourceId
        ? getOrThrow(sourceMap, tx.sourceId, 'Source')
        : null;

      return tx.components.map((c) => {
        const category = getOrThrow(categoryMap, c.categoryId, 'Category');
        const subcategory =
          c.subcategoryId !== null
            ? findByIdOrThrow(
                category.subcategories,
                c.subcategoryId,
                'Subcategory',
              )
            : null;

        return {
          id: c.id,
          name: formatComponentName(c, tx),
          rawName: c.name,
          cost: {
            cost: c.cost,
            isSubscription: false,
            isUpcomingSubscription: false,
            isIncome: category.isIncome,
            parentExpenseName: tx.name,
          },
          date: tx.date.format(DATE_FORMAT),
          category: category.name,
          categoryId: c.categoryId,
          categoryShortname: parentCategory.shortname,
          categoryIcon: category.icon,
          subcategory: subcategory?.name ?? null,
          subcategoryId: c.subcategoryId,
          source: source?.name ?? '',
          sourceId: tx.sourceId ?? null,
          subscriptionId: null,
          isUpcomingSubscription: false,
          isFromSavings: false,
          expenseId: tx.id,
          isIncome: category.isIncome,
          isContinuous: category.isContinuous,
        };
      });
    },
    [formatComponentName],
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
  const selectedMonth = useAtomValue(selectedMonthKeyAtom); // 'YYYY-MM'
  const year = useAtomValue(selectedYearAtom);
  const viewMode = useAtomValue(viewModeAtom); // 'month' | 'year'

  const { data: transactions } = useQuery(getTransactionsQueryOptions(year));
  const { data: categoryMap } = useQuery(getCategoryMapQueryOptions());
  const { data: sourceMap } = useQuery(getSourceMapQueryOptions());
  const { data: savingSpendingCategoryMap } = useQuery(
    getSavingSpendingCategoryMapQueryOptions(),
  );
  const { data: savingSpendingMap } = useQuery(
    getSavingSpendingMapQueryOptions(),
  );
  const availableSubscriptions = useAvailableSubscriptions();

  if (
    !transactions ||
    !categoryMap ||
    !sourceMap ||
    !savingSpendingCategoryMap ||
    !savingSpendingMap ||
    !availableSubscriptions
  ) {
    return undefined;
  }

  const search = searchString.toLowerCase();

  const monthFiltered = transactions.filter(
    (tx) => viewMode !== 'month' || tx.date.format('YYYY-MM') === selectedMonth,
  );

  const filtered = monthFiltered.filter((tx) =>
    matchesNameOrCost(
      tx.name,
      costWithoutComponents(tx.cost, tx.components),
      search,
    ),
  );

  const transactionRows = filtered.map((tx) =>
    mapTransaction(
      tx,
      categoryMap,
      sourceMap,
      savingSpendingCategoryMap,
      savingSpendingMap,
    ),
  );

  const subscriptionRows = showUpcoming
    ? availableSubscriptions
        .filter((a) => a.transactionId === null)
        .filter((a) =>
          matchesNameOrCost(a.subscription.name, a.subscription.cost, search),
        )
        .map((a) => mapSubscription(a, categoryMap, sourceMap))
    : [];

  const filteredIds = new Set(filtered.map((tx) => tx.id));

  // A transaction's components are shown whenever the parent transaction
  // matches, but a component can also surface on its own if its own cost
  // matches the search — its name is never checked independently, mirroring
  // how the parent transaction match already governs component visibility.
  const componentRows = monthFiltered.flatMap((tx) => {
    const components = mapComponents(tx, categoryMap, sourceMap);
    if (!search || filteredIds.has(tx.id)) {
      return components;
    }
    return components.filter(
      (c) => c.cost !== null && matchesCostQuery(c.cost.cost, search),
    );
  });

  return [...transactionRows, ...subscriptionRows, ...componentRows];
}

// #endregion
