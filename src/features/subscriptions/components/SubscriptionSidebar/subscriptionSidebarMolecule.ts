import { molecule } from 'bunshi';
import { atom } from 'jotai';

import type {
  NavTargets,
  ScrollRequest,
} from '~/shared/hooks/useTableSidebarNavigation';
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

  // ── Row navigation ────────────────────────────────────────────────────────
  // The table publishes the visible leaf rows adjacent to the focused one so the
  // sidebar's up/down buttons know where to go (null when there is none).
  const navTargetsAtom = atom<NavTargets>({ prevId: null, nextId: null });
  // Bumped to ask the table to scroll the focused row into view.
  const scrollRequestAtom = atom<ScrollRequest | null>(null);
  const requestScrollAtom = atom(null, (get, set, id: number) => {
    set(scrollRequestAtom, {
      id,
      token: (get(scrollRequestAtom)?.token ?? 0) + 1,
    });
  });

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

  // Move the edited subscription to an adjacent visible row (arrow buttons).
  // Routes through the dirty-check so a dirty/invalid form prompts to confirm.
  const navigateToSubscriptionAtom = atom(null, (_get, set, id: number) => {
    set(withDirtyCheckAtom, () => {
      set(editingIdAtom, id);
      set(isOpenAtom, true);
      set(requestScrollAtom, id);
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
    navTargetsAtom,
    scrollRequestAtom,
    navigateToSubscriptionAtom,
  };
});
