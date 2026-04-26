import { atom } from 'jotai';
import { atomEffect } from 'jotai-effect';
import type { MRT_TableInstance } from 'mantine-react-table';

import type { Subscription } from '~/features/subscriptions/schema';

export const insertedSubscriptionAtom = atom<{
  id: number;
  categoryId: number;
} | null>(null);

export const flashStateAtom = atom<{ id: number | null; fading: boolean }>({
  id: null,
  fading: false,
});

function scrollToRow(table: MRT_TableInstance<Subscription>, id: number) {
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
  table: MRT_TableInstance<Subscription>,
  categoryId: number,
): void {
  for (const row of table.getGroupedRowModel().rows) {
    if (Number(row.getGroupingValue('categoryId')) === categoryId) {
      row.toggleExpanded(true);
      return;
    }
  }
}

export const flashEffectAtom = (table: MRT_TableInstance<Subscription>) =>
  atomEffect((get, set) => {
    const sub = get(insertedSubscriptionAtom);
    if (!sub) {
      return;
    }
    expandGroup(table, sub.categoryId);
    set(flashStateAtom, { id: sub.id, fading: false });
    setTimeout(() => scrollToRow(table, sub.id), 50);
    const fadeTimer = setTimeout(() => {
      set(flashStateAtom, { id: sub.id, fading: true });
    }, 300);
    const clearTimer = setTimeout(() => {
      set(flashStateAtom, { id: null, fading: false });
    }, 1800);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(clearTimer);
    };
  });
