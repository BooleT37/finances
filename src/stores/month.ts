import dayjs from 'dayjs';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

/** Selected month stored as 'YYYY-MM', e.g. '2026-02'. Persisted to localStorage. */
export const selectedMonthAtom = atomWithStorage(
  'finances.selectedMonth',
  dayjs().format('YYYY-MM'),
);

/** Derived: numeric year from selectedMonthAtom, e.g. 2026 */
export const selectedYearAtom = atom((get) =>
  parseInt(get(selectedMonthAtom).slice(0, 4), 10),
);

/** Derived: numeric month (1-12) from selectedMonthAtom, e.g. 2 */
export const selectedMonthNumberAtom = atom((get) =>
  parseInt(get(selectedMonthAtom).slice(5, 7), 10),
);

/** Whether the navigator shows individual months or full years. Only meaningful on Expenses page. */
export const viewModeAtom = atomWithStorage<'month' | 'year'>(
  'finances.viewMode',
  'month',
);
