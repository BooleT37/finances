import { atom } from 'jotai';
import { atomEffect } from 'jotai-effect';
import type { MRT_TableInstance } from 'mantine-react-table';

import type { Category } from '~/features/categories/schema';

export const insertedCategoryAtom = atom<{
  id: number;
  isIncome: boolean;
} | null>(null);

export const flashStateAtom = atom<{ id: number | null; fading: boolean }>({
  id: null,
  fading: false,
});

function scrollToRow(table: MRT_TableInstance<Category>, id: number) {
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

function expandGroup(
  table: MRT_TableInstance<Category>,
  isIncome: boolean,
): void {
  for (const row of table.getGroupedRowModel().rows) {
    if (row.getGroupingValue('isIncome') === isIncome) {
      row.toggleExpanded(true);
      return;
    }
  }
}

export const flashEffectAtom = (table: MRT_TableInstance<Category>) =>
  atomEffect((get, set) => {
    const cat = get(insertedCategoryAtom);
    if (!cat) {
      return;
    }
    expandGroup(table, cat.isIncome);
    set(flashStateAtom, { id: cat.id, fading: false });
    setTimeout(() => scrollToRow(table, cat.id), 50);
    const fadeTimer = setTimeout(() => {
      set(flashStateAtom, { id: cat.id, fading: true });
    }, 300);
    const clearTimer = setTimeout(() => {
      set(flashStateAtom, { id: null, fading: false });
    }, 1800);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(clearTimer);
    };
  });
