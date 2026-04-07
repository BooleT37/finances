import { Group, Text } from '@mantine/core';
import { useAtomValue } from 'jotai';
import {
  MantineReactTable,
  MRT_ExpandButton,
  type MRT_ExpandedState,
  useMantineReactTable,
} from 'mantine-react-table';
import { MRT_Localization_RU } from 'mantine-react-table/locales/ru/index.cjs';
import { useTranslation } from 'react-i18next';

import { NameWithOptionalIcon } from '~/features/categories/components/NameWithOptionalIcon';
import { selectedMonthAtom, selectedYearAtom } from '~/stores/month';

import { buildBudgetingRowId } from './budgetingRowId';
import { useBudgetingTableColumns } from './columns/useBudgetingTableColumns';
import { useBudgetingRows } from './useBudgetingRows';
import { useSaveForecastComment } from './useSaveForecastComment';
import { useSaveForecastSum } from './useSaveForecastSum';

export function BudgetingTable() {
  const { t } = useTranslation('budgeting');

  const year = useAtomValue(selectedYearAtom);
  const month = useAtomValue(selectedMonthAtom);
  const { rows, isLoading } = useBudgetingRows(month, year);
  const savePlan = useSaveForecastSum(month, year);
  const saveComment = useSaveForecastComment(month, year);

  const columns = useBudgetingTableColumns({
    month,
    year,
    savePlan,
    saveComment,
  });

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
    editDisplayMode: 'cell',
    enableEditing: true,
    localization: MRT_Localization_RU,
    initialState: {
      expanded: {
        [buildBudgetingRowId({ rowType: 'typeGroup', isIncome: false })]: true,
        [buildBudgetingRowId({ rowType: 'typeGroup', isIncome: true })]: true,
      } as MRT_ExpandedState,
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
