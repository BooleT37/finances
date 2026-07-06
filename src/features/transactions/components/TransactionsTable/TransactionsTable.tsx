import { Group } from '@mantine/core';
import { useMolecule } from 'bunshi/react';
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
import { TableFlash, useTableFlash } from '~/shared/hooks/useTableFlash';
import { useTableLocalization } from '~/shared/hooks/useTableLocalization';
import type { NavRow } from '~/shared/hooks/useTableSidebarNavigation';
import {
  syncNavTargets,
  syncScrollRequest,
  useTableSidebarNavigation,
} from '~/shared/hooks/useTableSidebarNavigation';
import { expandRowEditableProps } from '~/shared/utils/table/expandRowEditableProps';

import { TransactionSidebarMolecule } from '../TransactionSidebar/transactionSidebarMolecule';
import { ComponentNameCellEdit } from './columns/NameCellRenderer/ComponentNameCellEdit';
import { TransactionNameCellEdit } from './columns/NameCellRenderer/TransactionNameCellEdit';
import { useTransactionTableColumns } from './columns/useTransactionTableColumns';
import { RowActions } from './RowActions';
import { transactionNameCellClass } from './TransactionsTable.constants';
import classes from './TransactionsTable.module.css';
import type { TransactionTableItem } from './TransactionsTable.types';
import { UpcomingSubscriptionRowActions } from './UpcomingSubscriptionRowActions';

/** Leaf transaction rows the editing focus can land on / arrow-navigate to. */
function isNavigable(row: NavRow<TransactionTableItem>): boolean {
  return (
    !row.original.isUpcomingSubscription && row.original.expenseId === null
  );
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

  const { withFlashingStyles, setTable } = useTableFlash<TransactionTableItem>(
    TableFlash.Transactions,
    { fadeDuration: 3000 },
  );

  const { focusedId, withNavigationStyles, setNavTargets, scrollRequest } =
    useTableSidebarNavigation({
      isOpenAtom,
      editingIdAtom,
      navTargetsAtom,
      scrollRequestAtom,
    });

  const tableLocalization = useTableLocalization();

  const table = useMantineReactTable({
    columns,
    data: items ?? [],
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
        ...expandRowEditableProps<TransactionTableItem>({
          enableEditing: (row) =>
            !row.getIsGrouped() && !row.original.isUpcomingSubscription,
          className: classes.editableNameCell,
          Cell: ({ row, table: t2 }) => (
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
          ),
          Edit: ({ row, table: t2 }) => (
            <Group
              align="center"
              gap="xs"
              wrap="nowrap"
              className={transactionNameCellClass}
              data-testing-depth={row.depth}
              data-testing-category-id={row.original.categoryId}
              data-testing-subcategory-id={
                row.original.subcategoryId ?? undefined
              }
            >
              <MRT_ExpandButton row={row} table={t2} />
              {row.original.expenseId !== null ? (
                <ComponentNameCellEdit row={row.original} table={t2} />
              ) : (
                <TransactionNameCellEdit row={row.original} table={t2} />
              )}
            </Group>
          ),
        }),
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
    mantineTableBodyCellProps: ({ column, row }) => ({
      style: {
        ...withFlashingStyles(row, column.id, {
          color: row.original.isUpcomingSubscription ? 'darkgray' : undefined,
          background: getRowBgColor(row.depth),
          padding: '8px',
        }),
        ...withNavigationStyles(row, column.id),
      },
    }),
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

  const rowModelRows = table.getRowModel().rows;
  useEffect(() => {
    syncNavTargets(table, focusedId, setNavTargets, isNavigable);
  }, [focusedId, rowModelRows, table, setNavTargets]);

  useEffect(() => {
    syncScrollRequest(table, scrollRequest);
  }, [scrollRequest, table]);

  return <MantineReactTable table={table} />;
}
