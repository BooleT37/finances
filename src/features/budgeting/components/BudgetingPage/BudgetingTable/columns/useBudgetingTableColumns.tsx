import { Group, Text, Tooltip } from '@mantine/core';
import Decimal from 'decimal.js';
import { createMRTColumnHelper, type MRT_Row } from 'mantine-react-table';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { CostWithDiffCellView } from '~/components/CostWithDiffCellView';
import { costToString } from '~/shared/utils/costToString';

import type {
  BudgetingGrandTotal,
  BudgetingRow,
} from '../BudgetingTable.types';
import { AverageCell } from './AverageCell';
import { GrandTotalSubscriptionBadge } from './GrandTotalSubscriptionBadge';
import { isPlanCellLocked } from './isPlanCellLocked';
import { PlanCell } from './PlanCell';

const columnHelper = createMRTColumnHelper<BudgetingRow>();

interface Params {
  month: number;
  year: number;
  grandTotal: BudgetingGrandTotal | undefined;
  savePlan: (row: MRT_Row<BudgetingRow>, enteredAbs: number) => void;
  saveComment: (row: MRT_Row<BudgetingRow>, value: string) => void;
}

export function useBudgetingTableColumns({
  month,
  year,
  grandTotal,
  savePlan,
  saveComment,
}: Params) {
  const { t } = useTranslation('budgeting');

  return useMemo(() => {
    const lastMonthVal = month === 0 ? 11 : month - 1;
    const lastMonthYear = month === 0 ? year - 1 : year;
    const zero = new Decimal(0);

    return [
      columnHelper.display({
        id: 'average',
        header: t('columns.average'),
        enableEditing: false,
        enableSorting: false,
        Cell: ({ row }) => (
          <AverageCell
            average={row.original.average}
            monthCount={row.original.monthCount}
            prevYear={year - 1}
            year={year}
          />
        ),
        Footer: () => (
          <Text size="sm" fw={600}>
            {costToString(grandTotal?.average ?? zero)}
          </Text>
        ),
        mantineTableBodyCellProps: {
          'data-testing-column': 'average',
        } as object,
        size: 120,
      }),
      columnHelper.display({
        id: 'lastMonth',
        header: t('columns.lastMonth'),
        enableEditing: false,
        enableSorting: false,
        Cell: ({ row }) => (
          <CostWithDiffCellView
            cost={row.original.lastMonthActual}
            forecast={row.original.lastMonthPlanSum}
            isContinuous={row.original.isContinuous}
            month={lastMonthVal}
            year={lastMonthYear}
            showPlanTooltip
          />
        ),
        Footer: () => (
          <CostWithDiffCellView
            cost={grandTotal?.lastMonthActual ?? zero}
            forecast={grandTotal?.lastMonthPlanSum ?? zero}
            isContinuous={false}
            month={lastMonthVal}
            year={lastMonthYear}
          />
        ),
        mantineTableBodyCellProps: {
          'data-testing-column': 'lastMonth',
        } as object,
        size: 120,
      }),
      columnHelper.accessor((row) => row.planSum?.abs().toNumber() ?? 0, {
        id: 'planSum',
        header: t('columns.plan'),
        enableEditing: (row) =>
          row.original.rowType !== 'typeGroup' &&
          !isPlanCellLocked(row.original),
        Cell: ({ row }) => <PlanCell row={row} month={month} year={year} />,
        Footer: ({ table }) => {
          const surplus = grandTotal?.planSum ?? zero;
          return (
            <Group
              gap={4}
              align="center"
              wrap="nowrap"
              data-testid="plan-footer"
            >
              <Text
                size="sm"
                fw={600}
                c={surplus.isNegative() ? 'red' : 'green'}
              >
                {costToString(surplus)}
              </Text>
              {grandTotal?.subscriptions &&
                grandTotal?.subscriptions.length > 0 && (
                  <GrandTotalSubscriptionBadge
                    allDue={grandTotal?.subscriptions}
                    rows={
                      table.getCoreRowModel().rows as MRT_Row<BudgetingRow>[]
                    }
                    month={month}
                    year={year}
                  />
                )}
            </Group>
          );
        },
        sortingFn: (rowA, rowB) =>
          (rowA.original.planSum ?? zero)
            .abs()
            .comparedTo((rowB.original.planSum ?? zero).abs()),
        mantineEditTextInputProps: ({ row, table }) => ({
          type: 'number',
          onBlur: (event) => {
            const { value } = event.target;
            const parsed = new Decimal(value || 0);
            if (!parsed.isNaN() && row.original.categoryId !== null) {
              savePlan(row, parsed.toNumber());
            }
          },
          onKeyDown: (event) => {
            if (event.key === 'Escape') {
              event.stopPropagation();
              table.setEditingCell(null);
            } else if (event.key === 'Enter') {
              event.currentTarget.blur();
            }
          },
        }),
        mantineTableBodyCellProps: { 'data-testing-column': 'plan' } as object,
        size: 120,
      }),
      columnHelper.display({
        id: 'thisMonth',
        header: t('columns.thisMonth'),
        enableEditing: false,
        enableSorting: false,
        Cell: ({ row }) => (
          <CostWithDiffCellView
            cost={row.original.thisMonthActual}
            forecast={row.original.planSum}
            isContinuous={row.original.isContinuous}
            month={month}
            year={year}
          />
        ),
        Footer: () => (
          <CostWithDiffCellView
            cost={grandTotal?.thisMonthActual ?? zero}
            forecast={grandTotal?.planSum ?? zero}
            isContinuous={false}
            month={month}
            year={year}
          />
        ),
        mantineTableBodyCellProps: {
          'data-testing-column': 'thisMonth',
        } as object,
        size: 120,
      }),
      columnHelper.accessor('comment', {
        header: t('columns.comment'),
        enableSorting: false,
        enableEditing: (row) =>
          row.original.rowType !== 'typeGroup' && !row.original.isRestRow,
        Cell: ({ row }) => {
          if (row.original.rowType === 'typeGroup') {
            return null;
          }
          if (row.original.isRestRow) {
            return (
              <Tooltip label={t('restRowTooltip')}>
                <Text style={{ cursor: 'not-allowed' }} size="sm" c="dimmed">
                  —
                </Text>
              </Tooltip>
            );
          }
          return (
            <Text size="sm" c={row.original.comment ? undefined : 'dimmed'}>
              {row.original.comment || ''}
            </Text>
          );
        },
        mantineEditTextInputProps: ({ row, table }) => ({
          onBlur: (event) => {
            if (row.original.categoryId !== null) {
              saveComment(row, event.target.value);
            }
          },
          onKeyDown: (event) => {
            if (event.key === 'Escape') {
              event.stopPropagation();
              table.setEditingCell(null);
            } else if (event.key === 'Enter') {
              event.currentTarget.blur();
            }
          },
        }),
        mantineTableBodyCellProps: {
          'data-testing-column': 'comment',
        } as object,
        size: 200,
      }),
    ];
  }, [t, month, year, grandTotal, savePlan, saveComment]);
}
