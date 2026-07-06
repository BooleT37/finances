import type { Atom, PrimitiveAtom } from 'jotai';
import { useAtomValue, useSetAtom } from 'jotai';
import type {
  MRT_Row,
  MRT_RowData,
  MRT_TableInstance,
} from 'mantine-react-table';
import type React from 'react';
import { useCallback } from 'react';

import { expandParentsOf, scrollToRow } from './useTableFlash';

// Minimal structural row shape so this works with both Row and MRT_Row, which
// TypeScript considers mutually non-assignable due to their columnDef types.
export interface NavRow<TData> {
  original: TData;
  getIsGrouped: () => boolean;
}

// `table.getRowModel().rows` is already the fully flattened, render-ready
// list once grouping + expansion are applied (each row's `depth` reflects its
// nesting) — group rows and their descendants are siblings in this same
// array, not nested exclusively under `subRows`. Recursing into `subRows`
// here would visit — and double-count — every descendant a second time.
function collectNavigableLeaves<TData>(
  rows: NavRow<TData>[],
  isNavigable: (row: NavRow<TData>) => boolean,
): NavRow<TData>[] {
  return rows.filter((row) => !row.getIsGrouped() && isNavigable(row));
}

export interface ScrollRequest {
  id: number;
  token: number;
}

export interface NavTargets {
  prevId: number | null;
  nextId: number | null;
}

const defaultIsNavigable = () => true;

/**
 * Publishes the visible navigable rows adjacent to the focused one (for a
 * sidebar's up/down navigation buttons). When the focused row is hidden
 * (filtered out / collapsed group), prev/next fall to the rows surrounding
 * its visual position. Call inside a `useEffect` keyed on
 * `[focusedId, table.getRowModel().rows, table, setNavTargets, isNavigable]`.
 */
export function syncNavTargets<TData extends MRT_RowData & { id: number }>(
  table: MRT_TableInstance<TData>,
  focusedId: number | null,
  setNavTargets: (targets: NavTargets) => void,
  isNavigable: (row: NavRow<TData>) => boolean = defaultIsNavigable,
) {
  if (focusedId === null) {
    setNavTargets({ prevId: null, nextId: null });
    return;
  }
  const leaves = collectNavigableLeaves(table.getRowModel().rows, isNavigable);
  const index = leaves.findIndex((r) => r.original.id === focusedId);
  if (index >= 0) {
    setNavTargets({
      prevId: index > 0 ? leaves[index - 1]!.original.id : null,
      nextId: index < leaves.length - 1 ? leaves[index + 1]!.original.id : null,
    });
    return;
  }
  // Focused row not currently visible: use its visual position among leaves.
  const allLeaves = collectNavigableLeaves(
    table.getCoreRowModel().rows,
    isNavigable,
  );
  const visiblePos = (id: number) =>
    leaves.findIndex((r) => r.original.id === id);
  const coreIndex = allLeaves.findIndex((r) => r.original.id === focusedId);
  let prevId: number | null = null;
  let nextId: number | null = null;
  for (let i = coreIndex - 1; i >= 0; i--) {
    const candidate = allLeaves[i]!.original.id;
    if (visiblePos(candidate) >= 0) {
      prevId = candidate;
      break;
    }
  }
  for (let i = coreIndex + 1; i < allLeaves.length; i++) {
    const candidate = allLeaves[i]!.original.id;
    if (visiblePos(candidate) >= 0) {
      nextId = candidate;
      break;
    }
  }
  setNavTargets({ prevId, nextId });
}

/**
 * Scrolls the focused row into view on request (arrow nav, edits, etc.). Call
 * inside a `useEffect` keyed on `[scrollRequest, table]` so it only fires
 * when a new request comes in, not on every unrelated re-render.
 */
export function syncScrollRequest<TData extends MRT_RowData & { id: number }>(
  table: MRT_TableInstance<TData>,
  scrollRequest: ScrollRequest | null,
) {
  if (!scrollRequest) {
    return;
  }
  expandParentsOf(table.getGroupedRowModel().rows, scrollRequest.id);
  setTimeout(() => scrollToRow(table, scrollRequest.id), 50);
}

interface UseTableSidebarNavigationOptions {
  isOpenAtom: Atom<boolean>;
  editingIdAtom: Atom<number | null | undefined>;
  navTargetsAtom: PrimitiveAtom<NavTargets>;
  scrollRequestAtom: Atom<ScrollRequest | null>;
}

/**
 * Derives a table's editing-focus id from its sidebar's open/editing atoms
 * and returns a style helper for drawing the focus outline — mirrors
 * `useTableFlash`/`withFlashingStyles`. Doesn't need the table instance
 * itself, so it can be called before `useMantineReactTable`. Pair it with
 * `syncNavTargets`/`syncScrollRequest` (called from `useEffect`s once the
 * table exists) to drive the sidebar's up/down row navigation. Shared by
 * every table that pairs with an editing sidebar (transactions, categories,
 * subscriptions).
 */
export function useTableSidebarNavigation({
  isOpenAtom,
  editingIdAtom,
  navTargetsAtom,
  scrollRequestAtom,
}: UseTableSidebarNavigationOptions) {
  const sidebarOpen = useAtomValue(isOpenAtom);
  const editingId = useAtomValue(editingIdAtom);
  const setNavTargets = useSetAtom(navTargetsAtom);
  const scrollRequest = useAtomValue(scrollRequestAtom);
  // Only highlight when editing an existing row (not create/closed).
  const focusedId =
    sidebarOpen && editingId != null && editingId >= 0 ? editingId : null;

  const withNavigationStyles = useCallback(
    <TData extends MRT_RowData & { id: number }>(
      row: MRT_Row<TData>,
      columnId: string,
    ): React.CSSProperties => {
      if (row.getIsGrouped() || row.original.id !== focusedId) {
        return {};
      }
      // Draw the focus outline with inset box-shadows rather than borders: the
      // table uses border-collapse, which drops the shared top/bottom borders
      // between rows. Shadows aren't collapsed and don't affect layout. Top and
      // bottom on every focused cell; left on the first column, right on the last.
      const cells = row.getVisibleCells();
      const isFirst = columnId === cells[0]?.column.id;
      const isLast = columnId === cells[cells.length - 1]?.column.id;
      const c = 'var(--mantine-primary-color-3)';
      const boxShadow = [
        `inset 0 2px 0 0 ${c}`,
        `inset 0 -2px 0 0 ${c}`,
        isFirst ? `inset 2px 0 0 0 ${c}` : null,
        isLast ? `inset -2px 0 0 0 ${c}` : null,
      ]
        .filter(Boolean)
        .join(', ');
      return { boxShadow };
    },
    [focusedId],
  );

  return { focusedId, withNavigationStyles, setNavTargets, scrollRequest };
}
