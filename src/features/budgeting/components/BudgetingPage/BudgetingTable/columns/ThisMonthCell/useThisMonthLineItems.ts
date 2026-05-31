import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { getTransactionsQueryOptions } from '~/features/transactions/queries';
import type { Transaction } from '~/features/transactions/schema';

import type { BudgetingRow } from '../../BudgetingTable.types';
import {
  type ThisMonthLineItem,
  type ThisMonthSelection,
  useThisMonthLineItemsForSelection,
} from './thisMonthLineItems';

const EMPTY: Transaction[] = [];

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
  const { data: monthTransactions = EMPTY } = useQuery({
    ...getTransactionsQueryOptions(year),
    select: useCallback(
      (transactions: Transaction[]) =>
        transactions.filter(
          (tx) => tx.date.month() === month && tx.date.year() === year,
        ),
      [month, year],
    ),
  });
  const selection = useMemo(() => rowSelection(row), [row]);

  return useThisMonthLineItemsForSelection(monthTransactions, selection);
}
