import { atom } from 'jotai';
import { atomEffect } from 'jotai-effect';
import type { MRT_TableInstance } from 'mantine-react-table';

import type { Transaction } from '../../schema';
import type { TransactionTableItem } from './TransactionsTable.types';

export const insertedTransactionsAtom = atom<Transaction[] | null>(null);

export const insertedTransactionAtom = atom(
  null,
  (_get, set, tx: Transaction) => {
    set(insertedTransactionsAtom, [tx]);
  },
);

export const flashStateAtom = atom<{ ids: Set<number>; fading: boolean }>({
  ids: new Set<number>(),
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
    const txs = get(insertedTransactionsAtom);
    if (!txs || txs.length === 0) {
      return;
    }
    const ids = new Set(txs.map((tx) => tx.id));
    const categoryIds = new Set(txs.map((tx) => tx.categoryId));
    for (const categoryId of categoryIds) {
      expandCategoryRow(table, categoryId);
    }
    set(flashStateAtom, { ids, fading: false });
    setTimeout(() => {
      const firstId = txs[0]?.id;
      if (firstId !== undefined) {
        scrollToRow(table, firstId);
      }
    }, 50);
    const fadeTimer = setTimeout(() => {
      set(flashStateAtom, { ids, fading: true });
    }, 300);
    const clearTimer = setTimeout(() => {
      set(flashStateAtom, { ids: new Set<number>(), fading: false });
      set(insertedTransactionsAtom, null);
    }, 1800);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(clearTimer);
    };
  });
