import type { UseFormReturnType } from '@mantine/form';
import { useEffect, useEffectEvent } from 'react';

import type { CategorySuggestion } from '~/features/import/categorySuggestions/categorySuggestion';

import type { ImportedTransactionFormValues } from './ImportedTransactionsModal';

/**
 * Fills each row's category with its category suggestion when they arrive,
 * leaving rows the user has already picked a category for untouched.
 */
export function usePrefillCategorySuggestions(
  form: UseFormReturnType<ImportedTransactionFormValues>,
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
