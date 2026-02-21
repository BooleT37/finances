import { atomWithStorage } from 'jotai/utils';

function formatCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/** Selected month stored as 'YYYY-MM', e.g. '2026-02'. Persisted to localStorage. */
export const selectedMonthAtom = atomWithStorage(
  'finances.selectedMonth',
  formatCurrentMonth(),
);

/** Whether the navigator shows individual months or full years. Only meaningful on Expenses page. */
export const viewModeAtom = atomWithStorage<'month' | 'year'>(
  'finances.viewMode',
  'month',
);
