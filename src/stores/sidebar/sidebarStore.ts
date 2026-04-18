import { atom } from 'jotai';

import { confirmUnsavedChanges } from './confirmUnsavedChanges';

export interface SidebarFormRef {
  isDirty: () => boolean;
}

export const sidebarFormRefAtom = atom<SidebarFormRef | null>(null);

export const withDirtyCheckAtom = atom(
  null,
  (get, _set, action: () => void) => {
    const formRef = get(sidebarFormRefAtom);
    if (formRef?.isDirty()) {
      confirmUnsavedChanges(action);
    } else {
      action();
    }
  },
);
