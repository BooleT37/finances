import { molecule } from 'bunshi';
import type { Getter, Setter } from 'jotai';
import { atom } from 'jotai';

import { createSidebarMolecule } from '~/stores/sidebar/createSidebarMolecule';

import type { CategoryFormType } from './categoryFormValues';

export const CategorySidebarMolecule = molecule(() => {
  const editingIdAtom = atom<number | null | undefined>(undefined);

  function doOpen(_get: Getter, set: Setter, id: number | null) {
    set(editingIdAtom, id);
  }

  function doClose(set: Setter) {
    set(editingIdAtom, undefined);
  }

  const { isOpenAtom, formRefAtom, openAtom, closeAtom } =
    createSidebarMolecule<CategoryFormType, number | null>({
      onOpen: doOpen,
      onClose: doClose,
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
