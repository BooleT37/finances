import { atom } from 'jotai';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';

import { getToday } from '~/shared/utils/today';

const selectedMonthStorage = {
  ...createJSONStorage<string>(),
  // Drop subscribing to local storage changes to keep storage per-tab
  subscribe: undefined,
};

/** Selected month stored as 'YYYY-MM', e.g. '2026-02'. Persisted to localStorage, per-tab only. */
export const selectedMonthKeyAtom = atomWithStorage(
  'finances.selectedMonth',
  getToday().format('YYYY-MM'),
  selectedMonthStorage,
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
