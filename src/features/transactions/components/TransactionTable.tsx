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
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { NameWithOptionalIcon } from '~/features/categories/components/NameWithOptionalIcon';
import {
  useSortAllCategoriesById,
  useSortSubcategories,
} from '~/features/categories/facets/categoriesOrder';
import {
  selectedMonthNumberAtom,
  selectedYearAtom,
  viewModeAtom,
} from '~/stores/month';

import type { TransactionTableItem } from '../transactionTableItem';
import { useTransactionTableColumns } from './columns/useTransactionTableColumns';
import { RowActions } from './RowActions';

export const transactionNameCellClassName = 'transaction-name-cell';

function getRowBgColor(depth: number) {
  if (depth === 0) return '#e0e0e0';
  if (depth === 1) return '#f0f0f0';
  return 'transparent';
}

interface Props {
  items: TransactionTableItem[] | undefined;
  groupBySubcategories: boolean;
}

export function TransactionTable({ items, groupBySubcategories }: Props) {
  const { t } = useTranslation('transactions');
  const year = useAtomValue(selectedYearAtom);
  // selectedMonthNumberAtom is 1-based; dayjs months are 0-based
  const month = useAtomValue(selectedMonthNumberAtom) - 1;
  const viewMode = useAtomValue(viewModeAtom);
  const isRangePicker = viewMode === 'year';

  const columns = useTransactionTableColumns({ month, year, isRangePicker });
  const sortAllCategoriesById = useSortAllCategoriesById();
  const sortSubcategories = useSortSubcategories();

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
    initialState: {
      grouping: ['isIncome', 'categoryId'],
      expanded: true,
      sorting: [
        { id: 'categoryId', desc: false },
        { id: 'subcategoryId', desc: false },
      ],
      // density: 'xs',
      columnVisibility: { subcategoryId: false },
    },
    state: {
      isLoading: !items,
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
            className={transactionNameCellClassName}
            data-category-id={
              row.getIsGrouped() ? undefined : row.original.categoryId
            }
            data-subcategory-id={
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
    mantineTableBodyCellProps: ({ row }) => ({
      style: {
        color: row.original.isUpcomingSubscription ? 'darkgray' : undefined,
        background: getRowBgColor(row.depth),
        padding: '8px',
      },
    }),
  });

  useEffect(() => {
    if (groupBySubcategories) {
      table.setGrouping(['isIncome', 'categoryId', 'subcategoryId']);
    } else {
      table.setGrouping(['isIncome', 'categoryId']);
    }
  }, [groupBySubcategories, table]);

  return <MantineReactTable table={table} />;
}
