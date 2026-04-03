import { Group, Text } from '@mantine/core';
import Decimal from 'decimal.js';
import { useAtomValue } from 'jotai';
import {
  MantineReactTable,
  type MRT_ColumnDef,
  MRT_ExpandButton,
  useMantineReactTable,
} from 'mantine-react-table';
import { MRT_Localization_RU } from 'mantine-react-table/locales/ru/index.cjs';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { NameWithOptionalIcon } from '~/features/categories/components/NameWithOptionalIcon';
import { costToString } from '~/shared/utils/costToString';
import { selectedMonthNumberAtom, selectedYearAtom } from '~/stores/month';

import type { BudgetingRow } from './BudgetingTable.types';
import { useBudgetingRows } from './useBudgetingRows';

export function BudgetingTable() {
  const { t } = useTranslation('budgeting');

  const year = useAtomValue(selectedYearAtom);
  const month = useAtomValue(selectedMonthNumberAtom);
  const { rows, isLoading } = useBudgetingRows(month, year);

  const surplus = useMemo(() => {
    if (!rows) {
      return new Decimal(0);
    }
    return rows.reduce((sum, r) => sum.plus(r.planSum), new Decimal(0));
  }, [rows]);

  const columns = useMemo<MRT_ColumnDef<BudgetingRow>[]>(
    () => [
      {
        id: 'planSum',
        accessorKey: 'planSum',
        header: t('columns.plan'),
        Cell: ({ row }) => (
          <Text size="sm">{costToString(row.original.planSum)}</Text>
        ),
        Footer: () => (
          <Text size="sm" fw={600} c={surplus.isNegative() ? 'red' : 'green'}>
            {costToString(surplus)}
          </Text>
        ),
        size: 120,
      },
    ],
    [t, surplus],
  );

  const table = useMantineReactTable({
    columns,
    data: rows ?? [],
    getSubRows: (row) => row.subRows,
    getRowId: (row) => row.id,
    enableExpanding: true,
    enableExpandAll: false,
    enableTopToolbar: false,
    enableBottomToolbar: false,
    enablePagination: false,
    enableColumnActions: false,
    enableColumnDragging: false,
    enableStickyHeader: true,
    enableStickyFooter: true,
    localization: MRT_Localization_RU,
    initialState: {
      expanded: true,
      density: 'xs',
    },
    state: {
      isLoading,
    },
    mantineTableContainerProps: {
      style: {
        // subtract 2px for the MRT Paper's 1px top + 1px bottom border
        maxHeight:
          'calc(100dvh - var(--app-shell-header-height) - var(--app-shell-padding) * 2 - 2px)',
      },
    },
    mantineTableFooterCellProps: {
      style: {
        padding:
          'var(--table-vertical-spacing) var(--table-horizontal-spacing, var(--mantine-spacing-xs))',
      },
    },
    displayColumnDefOptions: {
      'mrt-row-expand': {
        header: t('columns.name'),
        Footer: () => (
          <Text size="sm" fw={600}>
            {t('grandTotal')}
          </Text>
        ),
        Cell: ({ row, table: t2 }) => (
          <Group align="center" gap="xs" wrap="nowrap">
            <MRT_ExpandButton row={row} table={t2} />
            <NameWithOptionalIcon
              name={row.original.name}
              icon={row.original.icon}
            />
          </Group>
        ),
        size: 240,
      },
    },
    renderEmptyRowsFallback: () => (
      <Text c="dimmed" p="md">
        {t('emptyState')}
      </Text>
    ),
    mantineTableBodyRowProps: ({ row }) => ({
      style: {
        background:
          row.depth === 0
            ? '#e0e0e0'
            : row.depth === 1
              ? '#f0f0f0'
              : 'transparent',
      },
    }),
  });

  return <MantineReactTable table={table} />;
}
