import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MRT_Row } from 'mantine-react-table';
import { useCallback } from 'react';

import { getUpsertForecastMutationOptions } from '~/features/budgeting/queries';

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

      const subcategoryId = row.original.isRestRow
        ? null
        : row.original.subcategoryId;
      saveUpsert({
        categoryId,
        subcategoryId,
        month,
        year,
        sum: String(enteredAbs),
      });
    },
    [month, year, saveUpsert],
  );
}
