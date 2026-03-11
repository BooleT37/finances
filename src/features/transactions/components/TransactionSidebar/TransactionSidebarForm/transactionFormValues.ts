import type { UseFormReturnType } from '@mantine/form';

export interface TransactionComponentData {
  id?: number; // undefined for new (unsaved) components
  name: string;
  cost: string;
  categoryId: number;
  subcategoryId: number | null;
}

export type TransactionType = 'expense' | 'income' | 'fromSavings';

export interface TransactionFormValues {
  components: TransactionComponentData[];
  cost: string;
  name: string;
  date: Date | null;
  actualDate: Date | null;
  category: string | null;
  subcategory: string | null;
  source: string | null;
  subscription: string | null;
  savingSpendingCategoryId: string | null;
  savingSpendingId: string | null;
  transactionType: TransactionType;
}

export interface ValidatedTransactionFormValues extends Omit<
  TransactionFormValues,
  'date' | 'category'
> {
  date: Date;
  category: string;
}

export type TransactionFormTransform = (
  values: TransactionFormValues,
) => ValidatedTransactionFormValues | null;

export type TransactionFormType = UseFormReturnType<
  TransactionFormValues,
  TransactionFormTransform
>;
