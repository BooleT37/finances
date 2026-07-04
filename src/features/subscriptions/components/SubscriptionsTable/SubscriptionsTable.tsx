import { Group } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import Decimal from 'decimal.js';
import {
  MantineReactTable,
  MRT_ExpandButton,
  useMantineReactTable,
} from 'mantine-react-table';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getCategoryMapQueryOptions } from '~/features/categories/facets/categoryMap';
import { TableFlash, useTableFlash } from '~/shared/hooks/useTableFlash';
import { useTableLocalization } from '~/shared/hooks/useTableLocalization';
import { getOrThrow } from '~/shared/utils/getOrThrow';
import { expandRowEditableProps } from '~/shared/utils/table/expandRowEditableProps';

import { useSortedSubscriptions } from '../../facets/sortedSubscriptions';
import type { Subscription } from '../../schema';
import { useSubscriptionTableColumns } from './columns/useSubscriptionTableColumns';
import { RowActions } from './RowActions';
import { SubscriptionNameCellEdit } from './SubscriptionNameCellEdit';
import classes from './SubscriptionsTable.module.css';

function getRowBgColor(depth: number) {
  if (depth === 0) {
    return '#e0e0e0';
  }
  return 'transparent';
}

interface Props {
  mode: 'active' | 'archived';
}

export function SubscriptionsTable({ mode }: Props) {
  const { t } = useTranslation('subscriptions');
  const sorted = useSortedSubscriptions();
  const { data: categoryMap = {} } = useQuery(getCategoryMapQueryOptions());

  const filtered = useMemo(
    () => sorted?.filter((s) => s.active === (mode === 'active')),
    [sorted, mode],
  );

  const grandTotal = useMemo(
    () =>
      filtered?.reduce(
        (sum, s) => sum.plus(s.cost.abs().dividedBy(s.period)),
        new Decimal(0),
      ) ?? null,
    [filtered],
  );

  const columns = useSubscriptionTableColumns(grandTotal);

  const { withFlashingStyles, setTable } = useTableFlash<Subscription>(
    TableFlash.Subscriptions,
  );

  const tableLocalization = useTableLocalization();

  const table = useMantineReactTable({
    columns,
    data: filtered ?? [],
    getRowId: (row) => String(row.id),
    enableGrouping: true,
    enableEditing: true,
    editDisplayMode: 'cell',
    enableTopToolbar: false,
    enableBottomToolbar: false,
    enablePagination: false,
    enableColumnActions: false,
    enableColumnDragging: false,
    enableRowOrdering: false,
    enableRowActions: true,
    enableTableFooter: true,
    positionActionsColumn: 'last',
    groupedColumnMode: 'remove',
    layoutMode: 'grid-no-grow',
    initialState: {
      grouping: ['categoryId'],
      expanded: true,
      density: 'xs',
      columnVisibility: { categoryId: false },
    },
    state: {
      columnOrder: [
        'mrt-row-expand',
        'price',
        'firstDate',
        'sourceId',
        'mrt-row-actions',
      ],
      isLoading: !sorted,
    },
    mantineTableContainerProps: {
      style: {
        maxHeight:
          'calc(100dvh - var(--app-shell-header-height) - var(--app-shell-padding) * 2 - var(--mantine-spacing-md) * 2 - 36px)',
      },
    },
    mantineTableFooterCellProps: {
      style: {
        padding:
          'var(--table-vertical-spacing) var(--table-horizontal-spacing, var(--mantine-spacing-xs))',
        fontSize: 'inherit',
        verticalAlign: 'middle',
      },
    },
    mantineTableBodyCellProps: ({ column, row }) => ({
      style: withFlashingStyles(row, column.id, {
        background: getRowBgColor(row.depth),
      }),
    }),
    renderRowActions: ({ row }) => {
      if (row.getIsGrouped()) {
        return null;
      }
      return <RowActions row={row} mode={mode} />;
    },
    displayColumnDefOptions: {
      'mrt-row-actions': { header: '', size: 120 },
      'mrt-row-expand': {
        header: t('columns.name'),
        size: 220,
        ...expandRowEditableProps<Subscription>({
          enableEditing: (row) => !row.getIsGrouped(),
          className: classes.editableNameCell,
          Cell: ({ row, table: tbl }) => (
            <Group align="center" gap="xs" wrap="nowrap" w="100%">
              <MRT_ExpandButton row={row} table={tbl} />
              {row.getIsGrouped()
                ? getOrThrow(
                    categoryMap,
                    Number(row.getGroupingValue('categoryId')),
                    'Category',
                  ).name
                : row.original.name}
            </Group>
          ),
          Edit: ({ row, table: tbl }) => (
            <Group align="center" gap="xs" wrap="nowrap" w="100%">
              <MRT_ExpandButton row={row} table={tbl} />
              <SubscriptionNameCellEdit row={row.original} table={tbl} />
            </Group>
          ),
        }),
        Footer: () => t('columns.total'),
      },
    },
    localization: tableLocalization,
  });

  useEffect(() => {
    setTable(table);
  });

  return <MantineReactTable table={table} />;
}
