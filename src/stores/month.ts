import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

import { getToday } from '~/shared/utils/today';

/** Selected month stored as 'YYYY-MM', e.g. '2026-02'. Persisted to localStorage. */
export const selectedMonthKeyAtom = atomWithStorage(
  'finances.selectedMonth',
  getToday().format('YYYY-MM'),
);

/** Derived: numeric year from selectedMonthKeyAtom, e.g. 2026 */
export const selectedYearAtom = atom((get) =>
  parseInt(get(selectedMonthKeyAtom).slice(0, 4), 10),
);

/** Derived: 0-based month (0-11) from selectedMonthKeyAtom, e.g. 3 for April */
export const selectedMonthAtom = atom(
  (get) => parseInt(get(selectedMonthKeyAtom).slice(5, 7), 10) - 1,
);

/** Whether the navigator shows individual months or full years. Only meaningful on Expenses page. */
export const viewModeAtom = atomWithStorage<'month' | 'year'>(
  'finances.viewMode',
  'month',
);

/** Current search string on the transactions page. */
export const transactionSearchAtom = atom('');
