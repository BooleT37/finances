import { Group } from '@mantine/core';
import { useMolecule } from 'bunshi/react';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  MantineReactTable,
  MRT_ExpandAllButton,
  MRT_ExpandButton,
  useMantineReactTable,
} from 'mantine-react-table';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { NameWithOptionalIcon } from '~/features/categories/components/NameWithOptionalIcon';
import {
  useSortAllCategoriesById,
  useSortSubcategories,
} from '~/features/categories/facets/categoriesOrder';
import {
  expandParentsOf,
  scrollToRow,
  TableFlash,
  useTableFlash,
} from '~/shared/hooks/useTableFlash';
import { useTableLocalization } from '~/shared/hooks/useTableLocalization';

import { TransactionSidebarMolecule } from '../TransactionSidebar/transactionSidebarMolecule';
import { ComponentNameCellEdit } from './columns/NameCellRenderer/ComponentNameCellEdit';
import { TransactionNameCellEdit } from './columns/NameCellRenderer/TransactionNameCellEdit';
import { useTransactionTableColumns } from './columns/useTransactionTableColumns';
import { RowActions } from './RowActions';
import { transactionNameCellClass } from './TransactionsTable.constants';
import classes from './TransactionsTable.module.css';
import type { TransactionTableItem } from './TransactionsTable.types';
import { UpcomingSubscriptionRowActions } from './UpcomingSubscriptionRowActions';

// Minimal structural row shape so this works with both Row and MRT_Row, which
// TypeScript considers mutually non-assignable due to their columnDef types.
interface NavRow {
  original: TransactionTableItem;
  getIsGrouped: () => boolean;
  subRows?: NavRow[];
}

/** Leaf transaction rows the editing focus can land on / arrow-navigate to. */
function isNavigable(row: NavRow): boolean {
  return (
    !row.getIsGrouped() &&
    !row.original.isUpcomingSubscription &&
    row.original.expenseId === null
  );
}

function collectNavigableLeaves(rows: NavRow[], acc: NavRow[] = []): NavRow[] {
  for (const row of rows) {
    if (row.getIsGrouped()) {
      collectNavigableLeaves(row.subRows ?? [], acc);
    } else if (isNavigable(row)) {
      acc.push(row);
    }
  }
  return acc;
}

function getRowBgColor(depth: number) {
  if (depth === 0) {
    return '#e0e0e0';
  }
  if (depth === 1) {
    return '#f0f0f0';
  }
  return 'transparent';
}

interface Props {
  items: TransactionTableItem[] | undefined;
  groupBySubcategories: boolean;
}

export function TransactionTable({ items, groupBySubcategories }: Props) {
  const { t } = useTranslation('transactions');
  const columns = useTransactionTableColumns();
  const { sortAllCategoriesById } = useSortAllCategoriesById();
  const sortSubcategories = useSortSubcategories();

  const { isOpenAtom, editingIdAtom, navTargetsAtom, scrollRequestAtom } =
    useMolecule(TransactionSidebarMolecule);
  const sidebarOpen = useAtomValue(isOpenAtom);
  const editingId = useAtomValue(editingIdAtom);
  const setNavTargets = useSetAtom(navTargetsAtom);
  const scrollRequest = useAtomValue(scrollRequestAtom);
  // Only highlight when editing an existing transaction (not create/closed).
  const focusedId =
    sidebarOpen && editingId != null && editingId >= 0 ? editingId : null;

  const { withFlashingStyles, setTable } = useTableFlash<TransactionTableItem>(
    TableFlash.Transactions,
    { fadeDuration: 3000 },
  );

  const tableLocalization = useTableLocalization();

  const table = useMantineReactTable({
    columns,
    data: items ?? [],
    // `id` alone isn't unique across row kinds: Expense and ExpenseComponent
    // have independent auto-increment sequences (and every upcoming
    // subscription row shares the same placeholder id), so two unrelated rows
    // can report the same `id` and corrupt MRT's row/cell lookup (e.g.
    // editingCell jumping to the wrong row after a save).
    getRowId: (row) => {
      if (row.isUpcomingSubscription) {
        return `subscription-${row.subscriptionId}`;
      }
      if (row.expenseId !== null) {
        return `component-${row.id}`;
      }
      return `transaction-${row.id}`;
    },
    enableGrouping: true,
    enableEditing: true,
    editDisplayMode: 'cell',
    enableTopToolbar: false,
    enableBottomToolbar: false,
    enableColumnDragging: false,
    enablePagination: false,
    groupedColumnMode: 'remove',
    enableColumnActions: true,
    enableStickyHeader: true,
    initialState: {
      grouping: ['isIncome', 'categoryId'],
      expanded: true,
      sorting: [
        { id: 'categoryId', desc: false },
        { id: 'subcategoryId', desc: false },
      ],
      density: 'xs',
      columnVisibility: { subcategoryId: false },
    },
    state: {
      isLoading: !items,
    },
    mantineTableContainerProps: {
      // 36px toolbar + --mantine-spacing-md stack gap + 2px MRT Paper border
      style: {
        maxHeight:
          'calc(100dvh - var(--app-shell-header-height) - var(--app-shell-padding) * 2 - 36px - var(--mantine-spacing-md) - 2px)',
      },
    },
    enableRowActions: true,
    renderRowActions: ({ row }) => {
      if (row.original.isUpcomingSubscription) {
        return <UpcomingSubscriptionRowActions row={row.original} />;
      }
      return (
        <RowActions
          id={row.original.id}
          parentExpenseId={row.original.expenseId}
          name={row.original.name}
        />
      );
    },
    positionActionsColumn: 'last',
    displayColumnDefOptions: {
      'mrt-row-expand': {
        Header: () => (
          <Group gap={4}>
            <MRT_ExpandAllButton table={table} />
            <div>{t('columns.name')}</div>
          </Group>
        ),
        // MRT's Edit machinery only applies to regular data columns, not this
        // display column, so the edit/display toggle here is handled by hand:
        // reading editingCell state directly and reusing the same
        // setEditingCell(cell) click-to-edit pattern as other columns.
        // enableEditing is still set (even though nothing reads it for the
        // actual toggle) purely so MRT applies its usual cursor/hover styling
        // to this cell, consistent with the other editable columns.
        enableEditing: (row) => !row.original.isUpcomingSubscription,
        mantineTableBodyCellProps: ({ row, cell, table: t2 }) => {
          const isEditable =
            !row.getIsGrouped() && !row.original.isUpcomingSubscription;
          return {
            className: isEditable ? classes.editableNameCell : undefined,
            onClick: () => {
              if (isEditable) {
                t2.setEditingCell(cell);
              }
            },
          };
        },
        Cell: ({ row, cell, table: t2 }) => {
          const isEditingThisCell = t2.getState().editingCell?.id === cell.id;
          return (
            <Group
              align="center"
              gap="xs"
              wrap="nowrap"
              className={transactionNameCellClass}
              data-testing-depth={row.depth}
              data-testing-category-id={
                row.getIsGrouped() ? undefined : row.original.categoryId
              }
              data-testing-subcategory-id={
                !row.getIsGrouped() && row.original.subcategoryId !== null
                  ? row.original.subcategoryId
                  : undefined
              }
            >
              <MRT_ExpandButton row={row} table={t2} />
              {row.getIsGrouped() ? (
                row.depth === 0 ? (
                  (row.getGroupingValue('isIncome') as string)
                ) : row.depth === 1 ? (
                  <NameWithOptionalIcon
                    name={row.original.category}
                    icon={row.original.categoryIcon}
                    reserveIconSpace
                  />
                ) : (
                  (row.original.subcategory ?? t('columns.noSubcategory'))
                )
              ) : isEditingThisCell ? (
                row.original.expenseId !== null ? (
                  <ComponentNameCellEdit row={row.original} table={t2} />
                ) : (
                  <TransactionNameCellEdit row={row.original} table={t2} />
                )
              ) : (
                <span
                  title={row.original.name}
                  style={{
                    maxWidth: 300,
                    display: 'inline-block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row.original.name}
                </span>
              )}
            </Group>
          );
        },
        GroupedCell: ({ row }) => row.original.name,
        size: 200,
      },
      'mrt-row-actions': {
        minSize: 110,
      },
    },
    sortingFns: {
      sortCategories: (rowA, rowB) =>
        rowA.getIsGrouped() && rowB.getIsGrouped()
          ? sortAllCategoriesById(
              rowA.getGroupingValue('categoryId') as number,
              rowB.getGroupingValue('categoryId') as number,
            )
          : 0,
      sortSubcategories: (rowA, rowB) =>
        rowA.getIsGrouped() && rowB.getIsGrouped()
          ? sortSubcategories(
              rowA.getGroupingValue('categoryId') as number,
              rowA.getGroupingValue('subcategoryId') as number | null,
              rowB.getGroupingValue('subcategoryId') as number | null,
            )
          : 0,
    },
    localization: tableLocalization,
    mantineTableBodyCellProps: ({ column, row, table: t2 }) => {
      const isFocused = !row.getIsGrouped() && row.original.id === focusedId;
      const leafColumns = t2.getVisibleLeafColumns();
      const isFirst = column.id === leafColumns[0]?.id;
      const isLast = column.id === leafColumns[leafColumns.length - 1]?.id;
      // Draw the focus outline with inset box-shadows rather than borders: the
      // table uses border-collapse, which drops the shared top/bottom borders
      // between rows. Shadows aren't collapsed and don't affect layout. Top and
      // bottom on every focused cell; left on the first column, right on the last.
      const c = 'var(--mantine-primary-color-3)';
      const boxShadow = isFocused
        ? [
            `inset 0 2px 0 0 ${c}`,
            `inset 0 -2px 0 0 ${c}`,
            isFirst ? `inset 2px 0 0 0 ${c}` : null,
            isLast ? `inset -2px 0 0 0 ${c}` : null,
          ]
            .filter(Boolean)
            .join(', ')
        : undefined;
      return {
        style: withFlashingStyles(row, column.id, {
          color: row.original.isUpcomingSubscription ? 'darkgray' : undefined,
          background: getRowBgColor(row.depth),
          padding: '8px',
          boxShadow,
        }),
      };
    },
  });

  useEffect(() => {
    setTable(table);
  });

  useEffect(() => {
    if (groupBySubcategories) {
      table.setGrouping(['isIncome', 'categoryId', 'subcategoryId']);
    } else {
      table.setGrouping(['isIncome', 'categoryId']);
    }
  }, [groupBySubcategories, table]);

  // Publish the visible navigable rows adjacent to the focused one. When the
  // focused row is hidden (filtered out / collapsed group), prev/next fall to
  // the rows surrounding its visual position.
  const rowModelRows = table.getRowModel().rows;
  useEffect(() => {
    if (focusedId === null) {
      setNavTargets({ prevId: null, nextId: null });
      return;
    }
    const leaves = collectNavigableLeaves(rowModelRows);
    const index = leaves.findIndex((r) => r.original.id === focusedId);
    if (index >= 0) {
      setNavTargets({
        prevId: index > 0 ? leaves[index - 1]!.original.id : null,
        nextId:
          index < leaves.length - 1 ? leaves[index + 1]!.original.id : null,
      });
      return;
    }
    // Focused row not currently visible: use its visual position among leaves.
    const allLeaves = collectNavigableLeaves(table.getCoreRowModel().rows);
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
  }, [focusedId, rowModelRows, table, setNavTargets]);

  // Scroll the focused row into view on request (arrow nav, component edit, copy).
  useEffect(() => {
    if (!scrollRequest) {
      return;
    }
    expandParentsOf(table.getGroupedRowModel().rows, scrollRequest.id);
    setTimeout(() => scrollToRow(table, scrollRequest.id), 50);
  }, [scrollRequest, table]);

  return <MantineReactTable table={table} />;
}
