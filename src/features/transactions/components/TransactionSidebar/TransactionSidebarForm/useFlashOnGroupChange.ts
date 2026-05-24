import { useAtomValue } from 'jotai';
import { useCallback } from 'react';

import { TableFlash, useFlashTrigger } from '~/shared/hooks/useTableFlash';

import type { Transaction } from '../../../schema';
import { groupBySubcategoriesAtom } from '../../TransactionsPage/TransactionsPage.atoms';

/**
 * Flashes the transaction row when an edit moves it to a different table group:
 * always on a category change, and on a subcategory change while the table is
 * grouped by subcategory.
 */
export function useFlashOnGroupChange() {
  const triggerFlash = useFlashTrigger(TableFlash.Transactions);
  const groupBySubcategories = useAtomValue(groupBySubcategoriesAtom);

  return useCallback(
    (previous: Transaction | null, updated: Transaction) => {
      const categoryChanged = updated.categoryId !== previous?.categoryId;
      const subcategoryChanged =
        (updated.subcategoryId ?? null) !== (previous?.subcategoryId ?? null);
      if (categoryChanged || (groupBySubcategories && subcategoryChanged)) {
        triggerFlash([updated.id]);
      }
    },
    [triggerFlash, groupBySubcategories],
  );
}
