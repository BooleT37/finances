import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import { useCallback } from 'react';

import {
  getUpsertCategoryForecastMutationOptions,
  getUpsertSubcategoryForecastsMutationOptions,
} from '~/features/budgeting/queries';

import { formRowsToLineItems } from './BreakdownModal/BreakdownModal.utils';
import { isApplyingSubscriptionsAtom } from './budgetingTableAtoms';
import { fillPlanFromSubscriptions } from './fillFromSubscriptions';
import type { CategoryFillPlan, SubcategoriesFillPlan } from './fillPlans';

/**
 * Applies category and subcategories fill plans one at a time, never in
 * parallel — each plan is its own request/transaction, and concurrent
 * requests for the same category could race on the same recomputed sum.
 * Drives `isApplyingSubscriptionsAtom` for the duration, so the table can
 * show a loading overlay across the whole sequence.
 */
export function useApplyCategoryFillPlans(month: number, year: number) {
  const queryClient = useQueryClient();
  const setApplying = useSetAtom(isApplyingSubscriptionsAtom);
  const { mutateAsync: upsertCategory } = useMutation(
    getUpsertCategoryForecastMutationOptions(queryClient, year),
  );
  const { mutateAsync: upsertSubcategories } = useMutation(
    getUpsertSubcategoryForecastsMutationOptions(queryClient, year),
  );

  return useCallback(
    async (
      categoryPlans: CategoryFillPlan[],
      subcategoriesPlans: SubcategoriesFillPlan[],
    ) => {
      if (categoryPlans.length === 0 && subcategoriesPlans.length === 0) {
        return;
      }
      setApplying(true);
      try {
        for (const plan of categoryPlans) {
          const { rows, total } = fillPlanFromSubscriptions(
            plan.current,
            plan.due,
          );
          await upsertCategory({
            categoryId: plan.categoryId,
            month,
            year,
            sum: total.toString(),
            lineItems: formRowsToLineItems(rows),
          });
        }
        for (const plan of subcategoriesPlans) {
          await upsertSubcategories({
            categoryId: plan.categoryId,
            month,
            year,
            items: plan.items.map((item) => {
              const { rows, total } = fillPlanFromSubscriptions(
                item.current,
                item.due,
              );
              return {
                subcategoryId: item.subcategoryId,
                sum: total.toString(),
                lineItems: formRowsToLineItems(rows),
              };
            }),
          });
        }
      } finally {
        setApplying(false);
      }
    },
    [month, year, upsertCategory, upsertSubcategories, setApplying],
  );
}
