import type { Dayjs } from 'dayjs';
import type Decimal from 'decimal.js';

import type { ImportedTransaction } from './importedTransaction';

const MANUALLY_ENTERED_MAX_DAYS_APART = 5;

interface ExistingTransaction {
  date: Dayjs;
  cost: Decimal;
  importHash?: string | null;
}

function isManuallyEnteredNearby(
  importedTransaction: ImportedTransaction,
  tx: ExistingTransaction,
) {
  const daysApart = tx.date
    .startOf('day')
    .diff(importedTransaction.date.startOf('day'), 'day');
  return (
    tx.importHash == null &&
    tx.date.isSame(importedTransaction.date, 'month') &&
    Math.abs(daysApart) <= MANUALLY_ENTERED_MAX_DAYS_APART
  );
}

export function isSameTransaction(
  importedTransaction: ImportedTransaction,
  tx: ExistingTransaction,
) {
  if (tx.importHash != null && tx.importHash === importedTransaction.hash) {
    return true;
  }
  return (
    tx.cost.abs().eq(importedTransaction.amount.abs()) &&
    (tx.date.isSame(importedTransaction.date, 'day') ||
      isManuallyEnteredNearby(importedTransaction, tx))
  );
}
