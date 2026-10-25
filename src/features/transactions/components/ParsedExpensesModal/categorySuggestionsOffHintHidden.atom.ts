import { atomWithStorage } from 'jotai/utils';

export const categorySuggestionsOffHintHiddenAtom = atomWithStorage(
  'category-autofill-off-hint-hidden',
  false,
);
