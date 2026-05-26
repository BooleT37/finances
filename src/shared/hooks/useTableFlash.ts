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
  Sources = 'sources',
  Subscriptions = 'subscriptions',
  Transactions = 'transactions',
}

/**
 * A row to flash. Omit `columns` to flash the whole row (used to locate a row
 * after it moves or is created); provide `columns` (MRT column ids) to flash
 * only those cells (used to highlight which fields an edit changed).
 */
export interface FlashTarget {
  id: number;
  columns?: string[];
}

const flashAtomRegistry = new Map<
  TableFlash,
  PrimitiveAtom<FlashTarget[] | null>
>();

function getFlashAtom(name: TableFlash): PrimitiveAtom<FlashTarget[] | null> {
  if (!flashAtomRegistry.has(name)) {
    flashAtomRegistry.set(name, atom<FlashTarget[] | null>(null));
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
      [rowIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

/** `null` columns = flash the whole row; a Set = flash only those column ids. */
type FlashColumns = Set<string> | null;

export function useTableFlash<TData extends MRT_RowData & { id: number }>(
  tableName: TableFlash,
  options?: { fadeDuration?: number },
) {
  const { fadeDuration = 3000 } = options ?? {};

  const tableRef = useRef<MRT_TableInstance<TData> | null>(null);

  const [flashState, setFlashState] = useState<{
    targets: Map<number, FlashColumns>;
    fading: boolean;
  }>({ targets: new Map(), fading: false });

  const trigger = useAtomValue(getFlashAtom(tableName));

  useEffect(() => {
    if (!trigger) {
      return;
    }
    const targets = new Map<number, FlashColumns>(
      trigger.map(({ id, columns }) => [id, columns ? new Set(columns) : null]),
    );
    const table = tableRef.current;
    if (table) {
      for (const id of targets.keys()) {
        expandParentsOf(table.getGroupedRowModel().rows, id);
      }
      const firstId = [...targets.keys()][0];
      if (firstId !== undefined) {
        setTimeout(() => scrollToRow(table, firstId), 50);
      }
    }
    // Sync flash state with the external atom trigger; timers below schedule fade/clear.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFlashState({ targets, fading: false });
    const fadeTimer = setTimeout(
      () => setFlashState({ targets, fading: true }),
      300,
    );
    const clearTimer = setTimeout(
      () => setFlashState({ targets: new Map(), fading: false }),
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

  const { targets: flashTargets, fading } = flashState;

  const withFlashingStyles = useCallback(
    (
      row: MRT_Row<TData>,
      columnId: string,
      extraStyles?: React.CSSProperties,
    ): React.CSSProperties => {
      const columns = row.getIsGrouped()
        ? undefined
        : flashTargets.get(row.original.id);
      const isFlashing =
        columns !== undefined && (columns === null || columns.has(columnId));
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
    [flashTargets, fading, fadeDuration],
  );

  return { withFlashingStyles, setTable };
}
