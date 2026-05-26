import { useAtomValue } from 'jotai';
import { useCallback } from 'react';

import { TableFlash, useFlashTrigger } from '~/shared/hooks/useTableFlash';

import type { Transaction } from '../../../schema';
import { groupBySubcategoriesAtom } from '../../TransactionsPage/TransactionsPage.atoms';

/** Maps a changed transaction field to the MRT column id whose cell should flash. */
function getChangedColumns(
  previous: Transaction,
  updated: Transaction,
): string[] {
  const columns: string[] = [];
  if (updated.name !== previous.name) {
    columns.push('mrt-row-expand');
  }
  if (!updated.cost.eq(previous.cost)) {
    columns.push('cost');
  }
  if (!updated.date.isSame(previous.date)) {
    columns.push('date');
  }
  if ((updated.sourceId ?? null) !== (previous.sourceId ?? null)) {
    columns.push('source');
  }
  return columns;
}

/**
 * Flashes a transaction after a sidebar edit. When the edit moves the row to a
 * different table group (a category change, or a subcategory change while
 * grouped by subcategory) the whole row flashes so it can be located after it
 * jumps. Otherwise only the cells of the changed fields flash.
 */
export function useFlashOnGroupChange() {
  const triggerFlash = useFlashTrigger(TableFlash.Transactions);
  const groupBySubcategories = useAtomValue(groupBySubcategoriesAtom);

  return useCallback(
    (previous: Transaction | null, updated: Transaction) => {
      if (!previous) {
        triggerFlash([{ id: updated.id }]);
        return;
      }
      const categoryChanged = updated.categoryId !== previous.categoryId;
      const subcategoryChanged =
        (updated.subcategoryId ?? null) !== (previous.subcategoryId ?? null);
      if (categoryChanged || (groupBySubcategories && subcategoryChanged)) {
        triggerFlash([{ id: updated.id }]);
        return;
      }
      const columns = getChangedColumns(previous, updated);
      if (columns.length > 0) {
        triggerFlash([{ id: updated.id, columns }]);
      }
    },
    [triggerFlash, groupBySubcategories],
  );
}
