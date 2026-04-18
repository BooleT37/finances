import type { UseFormReturnType } from '@mantine/form';

export interface CategoryFormValues {
  icon: string | null;
  name: string;
  shortname: string;
  isIncome: 'income' | 'expense';
  isContinuous: boolean;
  subcategories: Array<{ id?: number; name: string }>;
}

export type CategoryFormType = UseFormReturnType<CategoryFormValues>;
