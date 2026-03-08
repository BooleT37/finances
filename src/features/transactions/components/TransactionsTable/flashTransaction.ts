import { atom } from 'jotai';
import { atomEffect } from 'jotai-effect';
import type { MRT_TableInstance } from 'mantine-react-table';

import type { Transaction } from '../../schema';
import type { TransactionTableItem } from '../../transactionTableItem';

export const insertedTransactionAtom = atom<Transaction | null>(null);

export const flashStateAtom = atom<{ id: number | null; fading: boolean }>({
  id: null,
  fading: false,
});

function scrollToRow(
  table: MRT_TableInstance<TransactionTableItem>,
  id: number,
) {
  const container = table.refs.tableContainerRef.current;
  if (!container) {
    return;
  }
  const flatRows = table.getRowModel().rows;
  const rowIndex = flatRows.findIndex(
    (r) => !r.getIsGrouped() && r.original.id === id,
  );
  if (rowIndex >= 0) {
    container
      .querySelectorAll('tbody tr')
      [rowIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function expandCategoryRow(
  table: MRT_TableInstance<TransactionTableItem>,
  categoryId: number,
) {
  for (const isIncomeRow of table.getGroupedRowModel().rows) {
    for (const categoryRow of isIncomeRow.subRows) {
      if (categoryRow.getGroupingValue('categoryId') === categoryId) {
        isIncomeRow.toggleExpanded(true);
        categoryRow.toggleExpanded(true);
        return;
      }
    }
  }
}

export const flashEffectAtom = (
  table: MRT_TableInstance<TransactionTableItem>,
) =>
  atomEffect((get, set) => {
    const tx = get(insertedTransactionAtom);
    if (!tx) {
      return;
    }
    expandCategoryRow(table, tx.categoryId);
    set(flashStateAtom, { id: tx.id, fading: false });
    setTimeout(() => scrollToRow(table, tx.id), 50);
    const fadeTimer = setTimeout(() => {
      set(flashStateAtom, { id: tx.id, fading: true });
    }, 300);
    const clearTimer = setTimeout(() => {
      set(flashStateAtom, { id: null, fading: false });
    }, 1800);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(clearTimer);
    };
  });
