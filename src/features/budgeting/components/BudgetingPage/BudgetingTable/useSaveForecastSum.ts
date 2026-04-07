import { useMutation, useQueryClient } from '@tanstack/react-query';
import Decimal from 'decimal.js';
import type { MRT_Row } from 'mantine-react-table';
import { useCallback } from 'react';

import { getUpsertForecastMutationOptions } from '~/features/budgeting/queries';
import { decimalSum } from '~/shared/utils/decimalSum';

import type { BudgetingRow } from './BudgetingTable.types';

export function useSaveForecastSum(month: number, year: number) {
  const queryClient = useQueryClient();
  const { mutate: saveUpsert } = useMutation(
    getUpsertForecastMutationOptions(queryClient, year),
  );

  return useCallback(
    (row: MRT_Row<BudgetingRow>, enteredAbs: number) => {
      const { categoryId } = row.original;
      if (categoryId === null) {
        return;
      }

      const siblings = row.getParentRow()?.subRows ?? [];

      if (row.original.isRestRow) {
        // Rest row: user is setting the uncategorized portion.
        // Save category plan = subcategorySum + enteredAbs so that rest = enteredAbs.
        const subcategoryAbsSum = decimalSum(
          ...siblings
            .filter((r) => !r.original.isRestRow)
            .map((r) => r.original.planSum.abs()),
        );
        saveUpsert({
          categoryId,
          subcategoryId: null,
          month,
          year,
          sum: String(subcategoryAbsSum.plus(enteredAbs).toNumber()),
        });
      } else if (row.original.rowType === 'subcategory') {
        // Named subcategory: also update the parent to keep the rest row value unchanged.
        const restAbsSum =
          siblings.find((r) => r.original.isRestRow)?.original.planSum.abs() ??
          new Decimal(0);
        const siblingsAbsSum = decimalSum(
          ...siblings
            .filter((r) => !r.original.isRestRow && r.id !== row.id)
            .map((r) => r.original.planSum.abs()),
        );
        saveUpsert({
          categoryId,
          subcategoryId: null,
          month,
          year,
          sum: String(
            siblingsAbsSum.plus(restAbsSum).plus(enteredAbs).toNumber(),
          ),
        });
        saveUpsert({
          categoryId,
          subcategoryId: row.original.subcategoryId,
          month,
          year,
          sum: String(enteredAbs),
        });
      } else {
        // Leaf category (no subcategories): save directly.
        saveUpsert({
          categoryId,
          subcategoryId: null,
          month,
          year,
          sum: String(enteredAbs),
        });
      }
    },
    [month, year, saveUpsert],
  );
}
