import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type Decimal from 'decimal.js';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import {
  getUpsertCategoryForecastMutationOptions,
  getUpsertSubcategoryForecastsMutationOptions,
} from '~/features/budgeting/queries';
import { getCategoryMapQueryOptions } from '~/features/categories/facets/categoryMap';
import { getOrThrow } from '~/shared/utils/getOrThrow';

import type { BreakdownFormRow } from './BreakdownModal/BreakdownModal.utils';
import { formRowsToLineItems } from './BreakdownModal/BreakdownModal.utils';
import { openBreakdownModal } from './BreakdownModal/openBreakdownModal';
import type { BudgetingRow } from './BudgetingTable.types';

export function useOpenBreakdownModal(month: number, year: number) {
  const { t } = useTranslation('budgeting');
  const queryClient = useQueryClient();
  const { data: categoryMap = {} } = useQuery(getCategoryMapQueryOptions());
  const { mutate: saveCategory } = useMutation(
    getUpsertCategoryForecastMutationOptions(queryClient, year),
  );
  const { mutate: saveSubcategories } = useMutation(
    getUpsertSubcategoryForecastsMutationOptions(queryClient, year),
  );

  return useCallback(
    (row: BudgetingRow) => {
      const { categoryId } = row;
      if (categoryId === null) {
        return;
      }

      /** `null` removes the breakdown, which leaves the row's sum as it was. */
      const write = (
        breakdown: { rows: BreakdownFormRow[]; total: Decimal } | null,
      ) => {
        const lineItems = breakdown ? formRowsToLineItems(breakdown.rows) : [];
        const sum = breakdown ? breakdown.total.toString() : undefined;

        if (row.rowType === 'category') {
          saveCategory({ categoryId, month, year, sum, lineItems });
        } else {
          saveSubcategories({
            categoryId,
            month,
            year,
            items: [
              {
                subcategoryId: row.isRestRow ? null : row.subcategoryId,
                sum,
                lineItems,
              },
            ],
          });
        }
      };

      // A subcategory's own name means little on its own — "Остальное" could
      // belong to any category — so name the category it sits under.
      const path =
        row.rowType === 'subcategory'
          ? `${getOrThrow(categoryMap, categoryId, 'Category').name} / ${row.name}`
          : row.name;

      openBreakdownModal({
        title: `${t('breakdown.title')} — ${path}`,
        lineItems: row.lineItems,
        onSave: (rows, total) => write({ rows, total }),
        onRemove: () => write(null),
      });
    },
    [t, month, year, categoryMap, saveCategory, saveSubcategories],
  );
}
