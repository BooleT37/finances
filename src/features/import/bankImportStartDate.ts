import type { Dayjs } from 'dayjs';

import { ISO_DATE_FORMAT } from '~/shared/constants';
import { getToday } from '~/shared/utils/today';

// Repeat imports start a little before the previous one, to catch rows the
// bank published a day after booking them. Rows already imported are
// recognised by their hash, so the overlap only adds unticked rows.
const REPEAT_IMPORT_OVERLAP_DAYS = 2;

export function bankImportStartDate({
  lastImportedAt,
  lastImportedTransactionDate,
}: {
  lastImportedAt: Dayjs | null;
  lastImportedTransactionDate: Dayjs | null;
}) {
  if (!lastImportedAt) {
    return getToday().startOf('month').format(ISO_DATE_FORMAT);
  }
  const importedUntil = lastImportedTransactionDate?.isBefore(lastImportedAt)
    ? lastImportedTransactionDate
    : lastImportedAt;
  return importedUntil
    .subtract(REPEAT_IMPORT_OVERLAP_DAYS, 'day')
    .format(ISO_DATE_FORMAT);
}
