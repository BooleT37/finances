import { createMRTColumnHelper } from 'mantine-react-table';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { TransactionTableItem } from '../TransactionsTable.types';
import { CostAggregatedCellRenderer } from './CostCellRenderer/CostAggregatedCellRenderer';
import { CostCellRenderer } from './CostCellRenderer/CostCellRenderer';
import { useCostAggregationFn } from './utils/useCostAggregationFn';

const columnHelper = createMRTColumnHelper<TransactionTableItem>();

export const useTransactionTableColumns = () => {
  const { t } = useTranslation('transactions');
  const costAggregationFn = useCostAggregationFn();

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
        aggregationFn: costAggregationFn,
        AggregatedCell: ({ cell, row }) => (
          <CostAggregatedCellRenderer
            value={cell.getValue()}
            isIncome={row.original.isIncome}
            isContinuous={row.original.isContinuous}
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
              row.getGroupingValue('subcategoryId') as number | undefined
            }
          />
        ),
        Cell: ({ cell }) => <CostCellRenderer value={cell.getValue()} />,
      }),
      columnHelper.accessor('date', {
        size: 130,
        header: t('columns.date'),
        enableGrouping: false,
      }),
      columnHelper.accessor('source', {
        size: 130,
        header: t('columns.source'),
        enableGrouping: false,
      }),
      columnHelper.accessor('categoryId', {
        header: t('columns.category'),
        sortingFn: 'sortCategories' as never,
      }),
    ],
    [costAggregationFn, t],
  );
};
