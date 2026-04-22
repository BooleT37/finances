import { useMemo } from 'react';

import { useExpenseCategories } from './expenseCategories';
import { useIncomeCategories } from './incomeCategories';

export const useCategoryTableItems = () => {
  const expenseCategories = useExpenseCategories();
  const incomeCategories = useIncomeCategories();
  return useMemo(
    () =>
      expenseCategories && incomeCategories
        ? [...expenseCategories, ...incomeCategories]
        : undefined,
    [expenseCategories, incomeCategories],
  );
};
