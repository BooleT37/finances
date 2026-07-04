import type { MRT_Row } from 'mantine-react-table';
import { createMRTColumnHelper } from 'mantine-react-table';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useOrderedSources } from '~/features/sources/facets/orderedSources';

import type { TransactionTableItem } from '../TransactionsTable.types';
import { ComponentCellEdit } from './CostCellRenderer/ComponentCellEdit';
import { CostAggregatedCellRenderer } from './CostCellRenderer/CostAggregatedCellRenderer';
import { CostCellRenderer } from './CostCellRenderer/CostCellRenderer';
import { TransactionCellEdit } from './CostCellRenderer/TransactionCellEdit';
import { TransactionDateCellEdit } from './DateCellRenderer/TransactionDateCellEdit';
import { TransactionSourceCellEdit } from './SourceCellRenderer/TransactionSourceCellEdit';
import { costFilterFn } from './utils/costFilterFn';
import { useCostAggregationFn } from './utils/useCostAggregationFn';

// Components have no independent `date`/`sourceId` in the schema — the table
// shows the parent transaction's, so those columns are only editable on the
// transaction's own row.
const canEditTransactionOnlyField = (row: MRT_Row<TransactionTableItem>) =>
  !row.getIsGrouped() &&
  !row.original.isUpcomingSubscription &&
  row.original.expenseId === null;

const columnHelper = createMRTColumnHelper<TransactionTableItem>();

export const useTransactionTableColumns = () => {
  const { t } = useTranslation('transactions');
  const costAggregationFn = useCostAggregationFn();
  const sources = useOrderedSources();

  const sourceFilterOptions = useMemo(
    () => (sources ?? []).map((s) => s.name),
    [sources],
  );

  return useMemo(
    () => [
      columnHelper.accessor('isIncome', {
        header: t('columns.type'),
        getGroupingValue: (row) =>
          row.isIncome
            ? t('groupingValues.income')
            : t('groupingValues.expense'),
      }),
      columnHelper.accessor('subcategoryId', {
        header: t('columns.subcategory'),
        sortingFn: 'sortSubcategories' as never,
      }),
      columnHelper.accessor('cost', {
        size: 150,
        header: t('columns.cost'),
        enableGrouping: false,
        enableEditing: (row) => !row.original.isUpcomingSubscription,
        mantineTableBodyCellProps: ({ row, cell, table }) => ({
          onClick: () => {
            if (!row.getIsGrouped() && !row.original.isUpcomingSubscription) {
              table.setEditingCell(cell);
            }
          },
        }),
        filterFn: costFilterFn,
        aggregationFn: costAggregationFn,
        AggregatedCell: ({ cell, row }) => (
          <CostAggregatedCellRenderer
            value={cell.getValue()}
            isIncome={row.original.isIncome}
            isContinuous={row.original.isContinuous}
            isFromSavingsGroup={
              row.groupingColumnId !== 'isIncome' && row.original.isFromSavings
            }
            isRestRow={
              row.groupingColumnId === 'subcategoryId' &&
              row.getGroupingValue('subcategoryId') === undefined
            }
            categoryId={
              row.groupingColumnId === 'isIncome'
                ? undefined
                : (row.getGroupingValue('categoryId') as number)
            }
            subcategoryId={
              row.groupingColumnId === 'subcategoryId'
                ? (row.getGroupingValue('subcategoryId') as number | undefined)
                : undefined
            }
          />
        ),
        Cell: ({ cell }) => <CostCellRenderer value={cell.getValue()} />,
        Edit: ({ cell, row, table }) =>
          row.original.expenseId !== null ? (
            <ComponentCellEdit
              value={cell.getValue()}
              row={row.original}
              table={table}
            />
          ) : (
            <TransactionCellEdit
              value={cell.getValue()}
              row={row.original}
              table={table}
            />
          ),
      }),
      columnHelper.accessor('date', {
        size: 130,
        header: t('columns.date'),
        enableGrouping: false,
        enableEditing: canEditTransactionOnlyField,
        mantineTableBodyCellProps: ({ row, cell, table }) => ({
          onClick: () => {
            if (canEditTransactionOnlyField(row)) {
              table.setEditingCell(cell);
            }
          },
        }),
        Edit: ({ row, table }) => (
          <TransactionDateCellEdit row={row.original} table={table} />
        ),
      }),
      columnHelper.accessor('source', {
        size: 130,
        header: t('columns.source'),
        enableGrouping: false,
        enableEditing: canEditTransactionOnlyField,
        mantineTableBodyCellProps: ({ row, cell, table }) => ({
          onClick: () => {
            if (canEditTransactionOnlyField(row)) {
              table.setEditingCell(cell);
            }
          },
        }),
        Edit: ({ row, table }) => (
          <TransactionSourceCellEdit row={row.original} table={table} />
        ),
        filterVariant: 'select',
        filterFn: 'equals',
        mantineFilterSelectProps: {
          data: sourceFilterOptions,
          searchable: true,
        },
      }),
      columnHelper.accessor('categoryId', {
        header: t('columns.category'),
        sortingFn: 'sortCategories' as never,
      }),
    ],
    [costAggregationFn, sourceFilterOptions, t],
  );
};
