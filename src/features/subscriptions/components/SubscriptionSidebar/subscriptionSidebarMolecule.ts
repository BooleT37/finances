import { molecule } from 'bunshi';
import { atom } from 'jotai';

import {
  sidebarFormRefAtom,
  withDirtyCheckAtom,
} from '~/stores/sidebar/sidebarStore';

import type { SubscriptionFormType } from './subscriptionFormValues';

export const SubscriptionSidebarMolecule = molecule(() => {
  const editingIdAtom = atom<number | null | undefined>(undefined);
  const isOpenAtom = atom(false);

  const _formAtom = atom<SubscriptionFormType | null>(null);
  const formRefAtom = atom(
    (get) => get(_formAtom),
    (_get, set, value: SubscriptionFormType | null) => {
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

  const closeAtom = atom(null, (get, set) => {
    set(withDirtyCheckAtom, () => {
      get(_formAtom)?.reset();
      set(editingIdAtom, undefined);
      set(isOpenAtom, false);
    });
  });

  const isNewSubscriptionAtom = atom((get) => get(editingIdAtom) === null);

  return {
    editingIdAtom,
    isOpenAtom,
    formRefAtom,
    openAtom,
    closeAtom,
    isNewSubscriptionAtom,
  };
});
