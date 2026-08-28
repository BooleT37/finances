import type { BudgetingRow } from '../BudgetingTable.types';

function isAuthoritativeChild(row: BudgetingRow): boolean {
  return row.lineItems.length > 0 || (!row.isRestRow && !row.planSum.isZero());
}

export function isPlanCellLocked(row: BudgetingRow): boolean {
  if (row.isUnderCategoryBreakdown || row.lineItems.length > 0) {
    return true;
  }
  if (row.rowType !== 'category' || !row.subRows) {
    return false;
  }
  return row.subRows.some(isAuthoritativeChild);
}
