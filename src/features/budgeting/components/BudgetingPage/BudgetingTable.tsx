import { Group, Text } from '@mantine/core';
import Decimal from 'decimal.js';
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

import type { BudgetingRow } from './BudgetingTable.types';

function formatPlanSum(planSum: Decimal): string {
  if (planSum.isZero()) {
    return '0';
  }
  if (planSum.isNegative()) {
    return '−' + planSum.abs().toFixed(0);
  }
  return planSum.toFixed(0);
}

interface Props {
  rows: BudgetingRow[] | undefined;
  isLoading: boolean;
}

export function BudgetingTable({ rows, isLoading }: Props) {
  const { t } = useTranslation('budgeting');

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
          <Text size="sm">{formatPlanSum(row.original.planSum)}</Text>
        ),
        Footer: () => (
          <Text size="sm" fw={600} c={surplus.isNegative() ? 'red' : 'green'}>
            {formatPlanSum(surplus)}
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
            {row.depth > 0 && <MRT_ExpandButton row={row} table={t2} />}
            {row.depth === 0 && <span>{row.original.name}</span>}
            {row.depth === 1 && (
              <NameWithOptionalIcon
                name={row.original.name}
                icon={row.original.icon}
              />
            )}
            {row.depth === 2 && <span>{row.original.name}</span>}
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
