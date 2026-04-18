import { molecule } from 'bunshi';
import { atom } from 'jotai';

import {
  sidebarFormRefAtom,
  withDirtyCheckAtom,
} from '~/stores/sidebar/sidebarStore';

import type { CategoryFormType } from './categoryFormValues';

export const CategorySidebarMolecule = molecule(() => {
  const editingIdAtom = atom<number | null | undefined>(undefined);
  const isOpenAtom = atom(false);

  const _formAtom = atom<CategoryFormType | null>(null);
  const formRefAtom = atom(
    (get) => get(_formAtom),
    (_get, set, value: CategoryFormType | null) => {
      set(_formAtom, value);
      set(sidebarFormRefAtom, value);
    },
  );

  const openAtom = atom(null, (_, set, id: number | null) => {
    set(withDirtyCheckAtom, () => {
      set(editingIdAtom, id);
      set(isOpenAtom, true);
    });
  });

  const closeAtom = atom(null, (_, set) => {
    set(withDirtyCheckAtom, () => {
      set(editingIdAtom, undefined);
      set(isOpenAtom, false);
    });
  });

  const isNewCategoryAtom = atom((get) => get(editingIdAtom) === null);

  return {
    editingIdAtom,
    isOpenAtom,
    formRefAtom,
    openAtom,
    closeAtom,
    isNewCategoryAtom,
  };
});
