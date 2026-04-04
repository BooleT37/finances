import type { BudgetingRow } from '../BudgetingTable.types';

export function isPlanCellLocked(row: BudgetingRow): boolean {
  if (row.rowType !== 'category' || !row.subRows) {
    return false;
  }
  return row.subRows.some((sub) => !sub.isRestRow && !sub.planSum.isZero());
}
