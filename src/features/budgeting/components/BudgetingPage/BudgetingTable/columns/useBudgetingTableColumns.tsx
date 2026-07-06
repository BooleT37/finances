import { Group, Text, Tooltip } from '@mantine/core';
import Decimal from 'decimal.js';
import { createMRTColumnHelper, type MRT_Row } from 'mantine-react-table';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { CostWithDiffCellView } from '~/components/CostWithDiffCellView';
import { costToString } from '~/shared/utils/costToString';
import { openCellForEditing } from '~/shared/utils/table/openCellForEditing';

import type {
  BudgetingGrandTotal,
  BudgetingRow,
} from '../BudgetingTable.types';
import { AverageCell } from './AverageCell';
import { GrandTotalSubscriptionBadge } from './GrandTotalSubscriptionBadge';
import { isPlanCellLocked } from './isPlanCellLocked';
import { PlanCell } from './PlanCell';
import { ThisMonthCell } from './ThisMonthCell/ThisMonthCell';

const columnHelper = createMRTColumnHelper<BudgetingRow>();

const canEditPlanCell = (row: MRT_Row<BudgetingRow>) =>
  row.original.rowType !== 'typeGroup' && !isPlanCellLocked(row.original);

const canEditCommentCell = (row: MRT_Row<BudgetingRow>) =>
  row.original.rowType !== 'typeGroup' && !row.original.isRestRow;

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
          <Text size="sm">{costToString(row.original.lastMonthActual)}</Text>
        ),
        Footer: () => (
          <Text size="sm" fw={600}>
            {costToString(grandTotal?.lastMonthActual ?? zero)}
          </Text>
        ),
        mantineTableBodyCellProps: {
          'data-testing-column': 'lastMonth',
        } as object,
        size: 120,
      }),
      columnHelper.accessor((row) => row.planSum?.abs().toNumber() ?? 0, {
        id: 'planSum',
        header: t('columns.plan'),
        enableEditing: canEditPlanCell,
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
              savePlan(row, Math.abs(parsed.toNumber()));
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
        mantineTableBodyCellProps: ({ row, cell, table }) => ({
          'data-testing-column': 'plan',
          onClick: () => {
            if (canEditPlanCell(row)) {
              openCellForEditing(table, cell);
            }
          },
        }),
        size: 120,
      }),
      columnHelper.display({
        id: 'thisMonth',
        header: t('columns.thisMonth'),
        enableEditing: false,
        enableSorting: false,
        Cell: ({ row }) => (
          <ThisMonthCell row={row.original} month={month} year={year} />
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
        enableEditing: canEditCommentCell,
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
        mantineTableBodyCellProps: ({ row, cell, table }) => ({
          'data-testing-column': 'comment',
          onClick: () => {
            if (canEditCommentCell(row)) {
              openCellForEditing(table, cell);
            }
          },
        }),
        size: 200,
      }),
    ];
  }, [t, month, year, grandTotal, savePlan, saveComment]);
}
