import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MRT_Row } from 'mantine-react-table-open';
import { useCallback } from 'react';

import {
  getUpsertCategoryForecastMutationOptions,
  getUpsertSubcategoryForecastsMutationOptions,
} from '~/features/budgeting/queries';

import type { BudgetingRow } from './BudgetingTable.types';

export function useSaveForecastComment(month: number, year: number) {
  const queryClient = useQueryClient();
  const { mutate: saveCategory } = useMutation(
    getUpsertCategoryForecastMutationOptions(queryClient, year),
  );
  const { mutate: saveSubcategories } = useMutation(
    getUpsertSubcategoryForecastsMutationOptions(queryClient, year),
  );

  return useCallback(
    (row: MRT_Row<BudgetingRow>, value: string) => {
      const { categoryId } = row.original;
      if (categoryId === null) {
        return;
      }
      if (row.original.rowType === 'category') {
        saveCategory({
          categoryId,
          month,
          year,
          comment: value,
        });
      } else {
        saveSubcategories({
          categoryId,
          month,
          year,
          items: [
            {
              subcategoryId: row.original.isRestRow
                ? null
                : row.original.subcategoryId,
              comment: value,
            },
          ],
        });
      }
    },
    [month, year, saveCategory, saveSubcategories],
  );
}
