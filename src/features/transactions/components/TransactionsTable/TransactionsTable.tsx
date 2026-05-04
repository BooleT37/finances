import { Group } from '@mantine/core';
import { useAtomValue } from 'jotai';
import {
  MantineReactTable,
  MRT_ExpandAllButton,
  MRT_ExpandButton,
  useMantineReactTable,
} from 'mantine-react-table';
// important to import cjs file directly: https://github.com/KevinVandy/mantine-react-table/issues/390#issuecomment-2348339328
import { MRT_Localization_RU } from 'mantine-react-table/locales/ru/index.cjs';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { NameWithOptionalIcon } from '~/features/categories/components/NameWithOptionalIcon';
import {
  useSortAllCategoriesById,
  useSortSubcategories,
} from '~/features/categories/facets/categoriesOrder';

import { useTransactionTableColumns } from './columns/useTransactionTableColumns';
import { flashEffectAtom, flashStateAtom } from './flashTransaction';
import { RowActions } from './RowActions';
import type { TransactionTableItem } from './TransactionsTable.types';

export const transactionNameCellClass = 'transaction-name-cell';

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

  const { ids: flashIds, fading } = useAtomValue(flashStateAtom);

  const table = useMantineReactTable({
    columns,
    data: items ?? [],
    enableGrouping: true,
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
        return undefined;
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
        GroupedCell: ({ row }) => row.original.name,
        size: 200,
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
    localization: MRT_Localization_RU,
    mantineTableBodyCellProps: ({ row }) => {
      const isFlashing = !row.getIsGrouped() && flashIds.has(row.original.id);
      return {
        style: {
          color: row.original.isUpcomingSubscription ? 'darkgray' : undefined,
          background: isFlashing
            ? fading
              ? 'transparent'
              : '#fffde7'
            : getRowBgColor(row.depth),
          transition:
            isFlashing && fading ? 'background 3s ease-out' : undefined,
          padding: '8px',
        },
      };
    },
  });

  const flashEffect = useMemo(() => flashEffectAtom(table), [table]);
  useAtomValue(flashEffect);

  useEffect(() => {
    if (groupBySubcategories) {
      table.setGrouping(['isIncome', 'categoryId', 'subcategoryId']);
    } else {
      table.setGrouping(['isIncome', 'categoryId']);
    }
  }, [groupBySubcategories, table]);

  return <MantineReactTable table={table} />;
}
