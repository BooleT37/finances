import type { UseFormReturnType } from '@mantine/form';
import { useEffect, useEffectEvent } from 'react';

import type { CategorySuggestion } from '~/features/transactions/categorySuggestions/categorySuggestion';

import type { ParsedExpenseFormValues } from './ParsedExpensesModal';

/**
 * Fills each row's category with its category suggestion when they arrive,
 * leaving rows the user has already picked a category for untouched.
 */
export function usePrefillCategorySuggestions(
  form: UseFormReturnType<ParsedExpenseFormValues>,
  categorySuggestions: (CategorySuggestion | null)[] | undefined,
) {
  const prefill = useEffectEvent(
    (suggestions: (CategorySuggestion | null)[]) => {
      suggestions.forEach((categorySuggestion, index) => {
        const row = form.getValues().expenses[index];
        if (categorySuggestion && row?.categorySubcategoryId === null) {
          form.setFieldValue(
            `expenses.${index}.categorySubcategoryId`,
            categorySuggestion.value,
          );
        }
      });
    },
  );

  useEffect(() => {
    if (categorySuggestions) {
      prefill(categorySuggestions);
    }
  }, [categorySuggestions]);
}
