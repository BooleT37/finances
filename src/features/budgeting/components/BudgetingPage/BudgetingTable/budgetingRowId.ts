export type BudgetingRowId =
  | 'expense'
  | 'income'
  | `cat-${number}`
  | `cat-${number}-sub-${number}`
  | `cat-${number}-rest`;

type BudgetingRowIdParams =
  | { rowType: 'typeGroup'; isIncome: boolean }
  | { rowType: 'category'; categoryId: number }
  | { rowType: 'subcategory'; categoryId: number; subcategoryId: number }
  | { rowType: 'rest'; categoryId: number };

export function buildBudgetingRowId(
  params: BudgetingRowIdParams,
): BudgetingRowId {
  switch (params.rowType) {
    case 'typeGroup':
      return params.isIncome ? 'income' : 'expense';
    case 'category':
      return `cat-${params.categoryId}`;
    case 'subcategory':
      return `cat-${params.categoryId}-sub-${params.subcategoryId}`;
    case 'rest':
      return `cat-${params.categoryId}-rest`;
  }
}

export function parseBudgetingRowId(id: BudgetingRowId): BudgetingRowIdParams {
  if (id === 'expense') {
    return { rowType: 'typeGroup', isIncome: false };
  }
  if (id === 'income') {
    return { rowType: 'typeGroup', isIncome: true };
  }

  const restMatch = id.match(/^cat-(\d+)-rest$/);
  if (restMatch) {
    return { rowType: 'rest', categoryId: parseInt(restMatch[1]!, 10) };
  }

  const subMatch = id.match(/^cat-(\d+)-sub-(\d+)$/);
  if (subMatch) {
    return {
      rowType: 'subcategory',
      categoryId: parseInt(subMatch[1]!, 10),
      subcategoryId: parseInt(subMatch[2]!, 10),
    };
  }

  const catMatch = id.match(/^cat-(\d+)$/);
  if (catMatch) {
    return { rowType: 'category', categoryId: parseInt(catMatch[1]!, 10) };
  }

  throw new Error(`Invalid BudgetingRowId: ${id}`);
}
