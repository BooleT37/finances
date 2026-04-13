import { useMutation, useQueryClient } from '@tanstack/react-query';
import Decimal from 'decimal.js';
import type { MRT_Row } from 'mantine-react-table';
import { useCallback } from 'react';

import type { UpsertForecastInput } from '~/features/budgeting/api';
import { getUpsertBulkForecastsMutationOptions } from '~/features/budgeting/queries';

import type { BudgetingRow } from './BudgetingTable.types';

export interface BulkItem {
  row: MRT_Row<BudgetingRow>;
  enteredAbs: Decimal;
}

function setParentCategorySum(
  row: MRT_Row<BudgetingRow>,
  categorySums: Map<number, Decimal>,
  categoryId: number,
  delta: Decimal,
) {
  const categorySum = categorySums.get(categoryId);
  if (categorySum !== undefined) {
    // if category sum already exits, just adjust it
    categorySums.set(categoryId, categorySum.plus(delta));
  } else {
    const currentCategorySum = new Decimal(
      row.getParentRow()?.original.planSum.abs() ?? 0,
    );
    categorySums.set(categoryId, new Decimal(currentCategorySum).plus(delta));
  }
}

/**
 * Converts a list of (row, enteredAbs) pairs into UpsertForecastInput items,
 * applying the same category/subcategory composition logic as useSaveForecastSum.
 * Multiple subcategory updates for the same parent are merged into a single
 * parent entry.
 */
function buildUpsertInputs(
  items: BulkItem[],
  month: number,
  year: number,
): UpsertForecastInput[] {
  // Map from categoryId to the new parent sum (absolute). Built up as we process
  // subcategory rows so multiple subs of the same parent are merged.
  const categorySums = new Map<number, Decimal>();
  const subcategoryInputs: UpsertForecastInput[] = [];

  for (const { row, enteredAbs } of items) {
    const { categoryId } = row.original;
    if (categoryId === null) {
      continue;
    }

    // assumption that we never update leaf category if it has subcategories
    if (row.original.rowType === 'category') {
      categorySums.set(categoryId, new Decimal(enteredAbs));
    } else {
      const delta = enteredAbs.minus(new Decimal(row.original.planSum.abs()));
      setParentCategorySum(row, categorySums, categoryId, delta);
      if (row.original.rowType === 'subcategory' && !row.original.isRestRow) {
        subcategoryInputs.push({
          categoryId,
          subcategoryId: row.original.subcategoryId,
          month,
          year,
          sum: enteredAbs.toString(),
        });
      }
    }
  }

  const categoryInputs: UpsertForecastInput[] = Array.from(
    categorySums.entries(),
  ).map(([categoryId, sum]) => ({
    categoryId,
    subcategoryId: null,
    month,
    year,
    sum: String(sum.toNumber()),
  }));

  return [...subcategoryInputs, ...categoryInputs];
}

export function useBulkSaveForecastsSum(month: number, year: number) {
  const queryClient = useQueryClient();
  const { mutate: bulkUpsert } = useMutation(
    getUpsertBulkForecastsMutationOptions(queryClient, year),
  );

  return useCallback(
    (items: BulkItem[]) => {
      if (items.length === 0) {
        return;
      }
      const inputs = buildUpsertInputs(items, month, year);
      if (inputs.length > 0) {
        bulkUpsert(inputs);
      }
    },
    [month, year, bulkUpsert],
  );
}
