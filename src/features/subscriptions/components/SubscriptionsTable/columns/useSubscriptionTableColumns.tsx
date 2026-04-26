import { useQuery } from '@tanstack/react-query';
import Decimal from 'decimal.js';
import { type MRT_ColumnDef } from 'mantine-react-table';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getSourceMapQueryOptions } from '~/features/sources/facets/sourceMap';
import { costToString } from '~/shared/utils/costToString';

import type { Subscription } from '../../../schema';

export function useSubscriptionTableColumns(): MRT_ColumnDef<Subscription>[] {
  const { t } = useTranslation('subscriptions');
  const { data: sourceMap = {} } = useQuery(getSourceMapQueryOptions());

  return useMemo<MRT_ColumnDef<Subscription>[]>(() => {
    const getPeriodLabel = (period: number) => {
      if (period === 1) {
        return t('form.periodMonth');
      }
      if (period === 3) {
        return t('form.periodQuarter');
      }
      if (period === 6) {
        return t('form.periodSixMonths');
      }
      return t('form.periodYear');
    };

    return [
      {
        accessorKey: 'categoryId',
        header: '',
      },
      {
        id: 'price',
        accessorFn: (row) => row.cost.abs().dividedBy(row.period).toNumber(),
        header: t('columns.price'),
        aggregationFn: 'sum',
        Cell: ({ row }) =>
          `${costToString(row.original.cost.abs())} / ${getPeriodLabel(row.original.period)}`,
        AggregatedCell: ({ cell }) =>
          `${costToString(new Decimal(cell.getValue<number>()))} ${t('columns.monthlyTotal')}`,
        Footer: ({ table }) => {
          const total = table
            .getFilteredRowModel()
            .rows.filter((r) => !r.getIsGrouped())
            .reduce((sum, r) => sum + r.getValue<number>('price'), 0);
          if (total === 0) {
            return null;
          }
          return `${t('columns.grandMonthlyTotal')}: ${costToString(new Decimal(total))}`;
        },
      },
      {
        accessorKey: 'firstDate',
        header: t('columns.firstDate'),
        Cell: ({ row }) => row.original.firstDate.format('DD.MM.YYYY'),
      },
      {
        accessorKey: 'sourceId',
        header: t('columns.source'),
        Cell: ({ row }) => {
          const { sourceId } = row.original;
          if (sourceId === null) {
            return null;
          }
          const source = sourceMap[sourceId];
          return source?.name ?? '';
        },
      },
    ];
  }, [t, sourceMap]);
}
