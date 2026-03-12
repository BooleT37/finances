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
  incomeCategory: string | null;
  incomeSubcategory: string | null;
  expenseCategory: string | null;
  expenseSubcategory: string | null;
  source: string | null;
  subscription: string | null;
  savingSpendingCategoryId: string | null;
  savingSpendingId: string | null;
  transactionType: TransactionType;
}

export type ValidatedTransactionFormValues = Omit<
  TransactionFormValues,
  | 'date'
  | 'incomeCategory'
  | 'incomeSubcategory'
  | 'expenseCategory'
  | 'expenseSubcategory'
  | 'transactionType'
> & {
  date: Date;
} & (
    | {
        transactionType: 'expense';
        expenseCategory: string;
        expenseSubcategory: string | null;
      }
    | {
        transactionType: 'income';
        incomeCategory: string;
        incomeSubcategory: string | null;
      }
    | {
        transactionType: 'fromSavings';
      }
  );
export interface TransformedTransactionFormValues extends Omit<
  ValidatedTransactionFormValues,
  | 'date'
  | 'expenseCategory'
  | 'expenseSubcategory'
  | 'incomeCategory'
  | 'incomeSubcategory'
> {
  date: Date;
  category: string;
  subcategory: string | null;
}

export type TransactionFormTransform = (
  values: TransactionFormValues,
) => TransformedTransactionFormValues | null;

export type TransactionFormType = UseFormReturnType<
  TransactionFormValues,
  TransactionFormTransform
>;
