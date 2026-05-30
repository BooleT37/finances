import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getTransactionsQueryOptions } from '~/features/transactions/queries';
import type {
  Transaction,
  TransactionComponent,
} from '~/features/transactions/schema';

import type { BudgetingRow } from '../../BudgetingTable.types';
import {
  buildThisMonthLineItems,
  type ThisMonthLineItem,
  type ThisMonthSelection,
} from './thisMonthLineItems';

function rowSelection(row: BudgetingRow): ThisMonthSelection | null {
  if (row.categoryId === null) {
    return null;
  }
  if (row.rowType === 'category') {
    return { categoryId: row.categoryId, subcategoryId: 'any' };
  }
  return {
    categoryId: row.categoryId,
    subcategoryId: row.isRestRow ? null : row.subcategoryId,
  };
}

export function useThisMonthLineItems(
  row: BudgetingRow,
  month: number,
  year: number,
): ThisMonthLineItem[] {
  const { t } = useTranslation('transactions');
  const { data: transactions } = useQuery(getTransactionsQueryOptions(year));

  const formatComponentName = useCallback(
    (component: TransactionComponent, parent: Transaction): string => {
      if (component.name && parent.name) {
        return t('componentWithParent', {
          componentName: component.name,
          parentName: parent.name,
        });
      }
      if (component.name) {
        return component.name;
      }
      if (parent.name) {
        return t('componentOfExpense', { name: parent.name });
      }
      return '';
    },
    [t],
  );

  return useMemo(() => {
    const selection = rowSelection(row);
    if (!transactions || !selection) {
      return [];
    }
    const monthTransactions = transactions.filter(
      (tx) => tx.date.month() === month && tx.date.year() === year,
    );
    return buildThisMonthLineItems(
      monthTransactions,
      selection,
      formatComponentName,
    );
  }, [transactions, row, month, year, formatComponentName]);
}
