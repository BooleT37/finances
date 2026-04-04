import { Text, Tooltip } from '@mantine/core';
import Decimal from 'decimal.js';
import { createMRTColumnHelper, type MRT_Row } from 'mantine-react-table';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { costToString } from '~/shared/utils/costToString';

import type { BudgetingRow } from '../BudgetingTable.types';
import { isPlanCellLocked } from './isPlanCellLocked';
import { PlanCell } from './PlanCell';

const columnHelper = createMRTColumnHelper<BudgetingRow>();

interface Params {
  surplus: Decimal;
  savePlan: (row: MRT_Row<BudgetingRow>, enteredAbs: number) => void;
  saveComment: (row: MRT_Row<BudgetingRow>, value: string) => void;
}

export function useBudgetingTableColumns({
  surplus,
  savePlan,
  saveComment,
}: Params) {
  const { t } = useTranslation('budgeting');

  return useMemo(
    () => [
      columnHelper.accessor((row) => row.planSum?.abs().toNumber() ?? 0, {
        id: 'planSum',
        header: t('columns.plan'),
        enableEditing: (row) =>
          row.original.rowType !== 'typeGroup' &&
          !isPlanCellLocked(row.original),
        Cell: ({ row }) => <PlanCell row={row} />,
        Footer: () => (
          <Text size="sm" fw={600} c={surplus.isNegative() ? 'red' : 'green'}>
            {costToString(surplus)}
          </Text>
        ),
        sortingFn: (rowA, rowB) =>
          (rowA.original.planSum ?? new Decimal(0))
            .abs()
            .comparedTo((rowB.original.planSum ?? new Decimal(0)).abs()),
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
        size: 200,
      }),
    ],
    [t, surplus, savePlan, saveComment],
  );
}
