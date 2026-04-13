import type { MRT_Row } from 'mantine-react-table';

import { decimalSum } from '~/shared/utils/decimalSum';

import type { BudgetingRow } from '../BudgetingTable.types';
import type { BulkItem } from '../useBulkSaveForecastsSum';
import { isPlanCellLocked } from './isPlanCellLocked';

/** Collect (row, enteredAbs) pairs for a single category or subcategory row. */
export function collectBulkItems(row: MRT_Row<BudgetingRow>): BulkItem[] {
  if (isPlanCellLocked(row.original)) {
    const items: BulkItem[] = [];
    for (const subRow of row.subRows ?? []) {
      if (
        subRow.original.isRestRow ||
        subRow.original.rowType !== 'subcategory' ||
        subRow.original.subscriptions.length === 0
      ) {
        continue;
      }
      items.push({
        row: subRow,
        enteredAbs: decimalSum(
          ...subRow.original.subscriptions.map((s) =>
            s.subscription.cost.abs(),
          ),
        ),
      });
    }
    return items;
  }

  // Unlocked category row with subcategories — iterate subRows to target each subcategory
  if (row.original.rowType === 'category' && (row.subRows ?? []).length > 0) {
    const items: BulkItem[] = [];
    for (const subRow of row.subRows ?? []) {
      if (
        subRow.original.isRestRow ||
        subRow.original.rowType !== 'subcategory' ||
        subRow.original.subscriptions.length === 0
      ) {
        continue;
      }
      items.push({
        row: subRow,
        enteredAbs: decimalSum(
          ...subRow.original.subscriptions.map((s) =>
            s.subscription.cost.abs(),
          ),
        ),
      });
    }
    return items;
  }

  if (row.original.subscriptions.length === 0) {
    return [];
  }

  return [
    {
      row,
      enteredAbs: decimalSum(
        ...row.original.subscriptions.map((s) => s.subscription.cost.abs()),
      ),
    },
  ];
}
