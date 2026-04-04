import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MRT_Row } from 'mantine-react-table';
import { useCallback } from 'react';

import { getUpsertForecastMutationOptions } from '~/features/budgeting/queries';

import type { BudgetingRow } from './BudgetingTable.types';

export function useSaveForecastComment(month: number, year: number) {
  const queryClient = useQueryClient();
  const { mutate: saveUpsert } = useMutation(
    getUpsertForecastMutationOptions(queryClient, year),
  );

  return useCallback(
    (row: MRT_Row<BudgetingRow>, value: string) => {
      const { categoryId } = row.original;
      if (categoryId === null) {
        return;
      }
      saveUpsert({
        categoryId,
        subcategoryId: row.original.subcategoryId,
        month,
        year,
        comment: value,
      });
    },
    [month, year, saveUpsert],
  );
}
