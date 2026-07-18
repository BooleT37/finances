import Decimal from 'decimal.js';
import type { MRT_FilterFn } from 'mantine-react-table-open';

import type {
  CostColValue,
  TransactionTableItem,
} from '../../TransactionsTable.types';

export const costFilterFn: MRT_FilterFn<TransactionTableItem> = (
  row,
  columnId,
  filterValue,
) => {
  const raw = String(filterValue ?? '').trim();
  if (!raw) {
    return true;
  }
  const value = row.getValue<CostColValue | null>(columnId);
  if (!value) {
    return false;
  }
  const normalizedRaw = raw.replace(/^-/, '');
  const costStr = value.cost.abs().toFixed(2);
  if (costStr.startsWith(normalizedRaw)) {
    return true;
  }
  let target: Decimal;
  try {
    target = new Decimal(raw);
  } catch {
    return true;
  }
  return value.cost.abs().equals(target.abs());
};
