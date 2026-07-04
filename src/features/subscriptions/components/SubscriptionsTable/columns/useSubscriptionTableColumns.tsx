import { useQuery } from '@tanstack/react-query';
import Decimal from 'decimal.js';
import { type MRT_ColumnDef } from 'mantine-react-table';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getSourceMapQueryOptions } from '~/features/sources/facets/sourceMap';
import { costToString } from '~/shared/utils/costToString';

import type { Subscription } from '../../../schema';
import { SubscriptionDateCellEdit } from './SubscriptionDateCellEdit';
import { SubscriptionPriceCellEdit } from './SubscriptionPriceCellEdit';
import { SubscriptionSourceCellEdit } from './SubscriptionSourceCellEdit';

export function useSubscriptionTableColumns(
  grandTotal: Decimal | null,
): MRT_ColumnDef<Subscription>[] {
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
        enableSorting: false,
      },
      {
        id: 'price',
        accessorFn: (row) => {
          if (row.cost == null) {
            return 0;
          }
          return row.cost.abs().dividedBy(row.period).toNumber();
        },
        header: t('columns.price'),
        aggregationFn: 'sum',
        enableEditing: (row) => !row.getIsGrouped(),
        mantineTableBodyCellProps: ({ row, cell, table }) => ({
          onClick: () => {
            if (!row.getIsGrouped()) {
              table.setEditingCell(cell);
            }
          },
        }),
        Cell: ({ row }) =>
          `${costToString(row.original.cost.abs())} / ${getPeriodLabel(row.original.period)}`,
        AggregatedCell: ({ cell }) =>
          `${costToString(new Decimal(cell.getValue<number>()))} ${t('columns.monthlyTotal')}`,
        Footer: () => {
          if (!grandTotal || grandTotal.isZero()) {
            return null;
          }
          return `${costToString(grandTotal)} ${t('columns.monthlyTotal')}`;
        },
        Edit: ({ row, table }) => (
          <SubscriptionPriceCellEdit row={row.original} table={table} />
        ),
      },
      {
        accessorKey: 'firstDate',
        header: t('columns.firstDate'),
        enableSorting: false,
        enableEditing: (row) => !row.getIsGrouped(),
        mantineTableBodyCellProps: ({ row, cell, table }) => ({
          onClick: () => {
            if (!row.getIsGrouped()) {
              table.setEditingCell(cell);
            }
          },
        }),
        Cell: ({ row }) => row.original.firstDate.format('DD.MM.YYYY'),
        Edit: ({ cell, row, table }) => (
          <SubscriptionDateCellEdit
            value={cell.getValue<Subscription['firstDate']>()}
            row={row.original}
            table={table}
          />
        ),
      },
      {
        accessorKey: 'sourceId',
        header: t('columns.source'),
        enableSorting: false,
        enableEditing: (row) => !row.getIsGrouped(),
        mantineTableBodyCellProps: ({ row, cell, table }) => ({
          onClick: () => {
            if (!row.getIsGrouped()) {
              table.setEditingCell(cell);
            }
          },
        }),
        Cell: ({ row }) => {
          const { sourceId } = row.original;
          if (sourceId === null) {
            return null;
          }
          const source = sourceMap[sourceId];
          return source?.name ?? '';
        },
        Edit: ({ cell, row, table }) => (
          <SubscriptionSourceCellEdit
            value={cell.getValue<Subscription['sourceId']>()}
            row={row.original}
            table={table}
          />
        ),
      },
    ];
  }, [t, sourceMap, grandTotal]);
}
