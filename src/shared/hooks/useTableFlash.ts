import type { Row } from '@tanstack/react-table';
import type { PrimitiveAtom } from 'jotai';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import type {
  MRT_Row,
  MRT_RowData,
  MRT_TableInstance,
} from 'mantine-react-table';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

export enum TableFlash {
  Categories = 'categories',
  Subscriptions = 'subscriptions',
  Transactions = 'transactions',
}

const flashAtomRegistry = new Map<TableFlash, PrimitiveAtom<number[] | null>>();

function getFlashAtom(name: TableFlash): PrimitiveAtom<number[] | null> {
  if (!flashAtomRegistry.has(name)) {
    flashAtomRegistry.set(name, atom<number[] | null>(null));
  }
  return flashAtomRegistry.get(name)!;
}

function scrollToRow<TData extends MRT_RowData & { id: number }>(
  table: MRT_TableInstance<TData>,
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

function expandParentsOf<TData extends { id: number }>(
  rows: Row<TData>[],
  id: number,
): boolean {
  for (const row of rows) {
    if (!row.getIsGrouped()) {
      if (row.original.id === id) {
        return true;
      }
    } else if (expandParentsOf(row.subRows, id)) {
      row.toggleExpanded(true);
      return true;
    }
  }
  return false;
}

export function useFlashTrigger(tableName: TableFlash) {
  return useSetAtom(getFlashAtom(tableName));
}

export function useTableFlash<TData extends MRT_RowData & { id: number }>(
  tableName: TableFlash,
  options?: { fadeDuration?: number },
) {
  const { fadeDuration = 1500 } = options ?? {};

  const tableRef = useRef<MRT_TableInstance<TData> | null>(null);

  const [flashState, setFlashState] = useState<{
    ids: Set<number>;
    fading: boolean;
  }>({ ids: new Set(), fading: false });

  const trigger = useAtomValue(getFlashAtom(tableName));

  useEffect(() => {
    if (!trigger) {
      return;
    }
    const ids = new Set(trigger);
    const table = tableRef.current;
    if (table) {
      for (const id of ids) {
        expandParentsOf(table.getGroupedRowModel().rows, id);
      }
      const firstId = [...ids][0];
      if (firstId !== undefined) {
        setTimeout(() => scrollToRow(table, firstId), 50);
      }
    }
    // Sync flash state with the external atom trigger; timers below schedule fade/clear.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFlashState({ ids, fading: false });
    const fadeTimer = setTimeout(
      () => setFlashState({ ids, fading: true }),
      300,
    );
    const clearTimer = setTimeout(
      () => setFlashState({ ids: new Set(), fading: false }),
      fadeDuration + 300,
    );
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(clearTimer);
    };
  }, [trigger, fadeDuration]);

  const setTable = useCallback((table: MRT_TableInstance<TData>) => {
    tableRef.current = table;
  }, []);

  const { ids: flashIds, fading } = flashState;

  const withFlashingStyles = useCallback(
    (
      row: MRT_Row<TData>,
      extraStyles?: React.CSSProperties,
    ): React.CSSProperties => {
      const isFlashing = !row.getIsGrouped() && flashIds.has(row.original.id);
      if (!isFlashing) {
        return { background: undefined, transition: undefined, ...extraStyles };
      }
      return {
        ...extraStyles,
        background: fading
          ? (extraStyles?.background ?? 'transparent')
          : '#fffde7',
        transition: fading
          ? `background ${fadeDuration}ms ease-out`
          : undefined,
      };
    },
    [flashIds, fading, fadeDuration],
  );

  return { withFlashingStyles, setTable };
}
