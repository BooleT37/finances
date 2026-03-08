// ── Component data (used for the component list in the form) ──────────────────

export interface TransactionComponentData {
  id?: number; // undefined for new (unsaved) components
  name: string;
  cost: string;
  categoryId: number;
  subcategoryId: number | null;
}

// ── Form values ───────────────────────────────────────────────────────────────

export interface TransactionFormValues {
  cost: string;
  name: string;
  date: Date | null;
  actualDate: Date | null;
  category: string | null;
  subcategory: string | null;
  source: string | null;
  subscription: string | null;
  savingSpendingCategoryId: string | null;
}

// ── Validated form values (required fields narrowed to non-null) ──────────────

export interface ValidatedTransactionFormValues extends Omit<
  TransactionFormValues,
  'date' | 'category'
> {
  date: Date;
  category: string;
}
