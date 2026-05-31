import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getTransactionsQueryOptions } from '~/features/transactions/queries';
import type { Transaction } from '~/features/transactions/schema';
import { costWithoutComponents } from '~/features/transactions/utils/costWithoutComponents';
import { useFormatComponentName } from '~/features/transactions/utils/useFormatComponentName';
import type { CostListItem } from '~/shared/components/CostList';

import type { BudgetingRow } from '../../BudgetingTable.types';

/**
 * The line items that make up a "this month" cell total, using the same
 * attribution as `computePairTotal`: a matching transaction contributes its
 * cost minus its components (the remainder), and any matching component
 * contributes its own cost — mirroring the transactions table.
 */
export function useThisMonthLineItems(
  row: BudgetingRow,
  month: number,
  year: number,
): CostListItem[] {
  const { t } = useTranslation('budgeting');
  const formatComponentName = useFormatComponentName();
  const { data: monthTransactions = [] } = useQuery({
    ...getTransactionsQueryOptions(year),
    select: useCallback(
      (transactions: Transaction[]) =>
        transactions.filter(
          (tx) => tx.date.month() === month && tx.date.year() === year,
        ),
      [month, year],
    ),
  });

  return useMemo(() => {
    if (row.categoryId === null) {
      return [];
    }

    const matches = <
      T extends { categoryId: number; subcategoryId: number | null },
    >({
      categoryId,
      subcategoryId,
    }: T): boolean => {
      if (categoryId !== row.categoryId) {
        return false;
      }
      // Category-level rows aggregate every subcategory; the "Other" row matches
      // items with no subcategory; subcategory rows match their own subcategory.
      if (row.rowType === 'category') {
        return true;
      }
      if (row.isRestRow) {
        return subcategoryId === null;
      }
      return subcategoryId === row.subcategoryId;
    };

    const noName = t('thisMonthTransactions.noName');

    const transactionItems = monthTransactions.filter(matches).map(
      (tx): CostListItem => ({
        key: `tx-${tx.id}`,
        name: tx.name || noName,
        cost: costWithoutComponents(tx.cost, tx.components),
        date: tx.date,
      }),
    );

    const componentItems = monthTransactions.flatMap((tx) =>
      tx.components.filter(matches).map(
        (component): CostListItem => ({
          key: `component-${component.id}`,
          name: formatComponentName(component, tx) || noName,
          cost: component.cost,
          date: tx.date,
        }),
      ),
    );

    return [...transactionItems, ...componentItems].sort((a, b) =>
      b.cost.abs().comparedTo(a.cost.abs()),
    );
  }, [monthTransactions, row, formatComponentName, t]);
}
