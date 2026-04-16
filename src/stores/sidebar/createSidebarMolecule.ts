import type { Getter, Setter } from 'jotai';
import { atom } from 'jotai';

import { confirmUnsavedChanges } from './confirmUnsavedChanges';

/**
 * Minimal interface the sidebar factory needs from a form ref.
 * Feature-specific form refs (e.g. TransactionFormType) are supersets of this.
 */
export interface SidebarFormRef {
  isDirty: () => boolean;
}

/**
 * Creates the four core atoms shared by every sidebar:
 *
 *   isOpenAtom   — boolean; set to true by openAtom, false by closeAtom
 *   formRefAtom  — set by the form via useEffect; used for dirty checks
 *   openAtom     — write-only: guards dirty state, calls onOpen, opens sidebar
 *   closeAtom    — write-only: guards dirty state, calls onClose, closes sidebar
 *
 * The feature molecule is fully responsible for its own editingIdAtom and any
 * other feature-specific state. It passes onOpen/onClose callbacks that manage
 * that state. The factory just wires up the open/close boolean and dirty guard.
 *
 * Generic parameters:
 *   TFormRef  — the feature's form ref type (must have isDirty())
 *   TOpenArg  — argument passed to openAtom and forwarded to onOpen;
 *               use `void` for sidebars with no per-item state
 */
export function createSidebarMolecule<
  TFormRef extends SidebarFormRef = SidebarFormRef,
  TOpenArg = void,
>({
  onOpen,
  onClose,
}: {
  onOpen: (get: Getter, set: Setter, arg: TOpenArg) => void;
  onClose: (set: Setter) => void;
}) {
  const isOpenAtom = atom(false);
  const formRefAtom = atom<TFormRef | null>(null);

  const openAtom = atom(null, (get, set, arg: TOpenArg) => {
    const formRef = get(formRefAtom);
    const doOpen = () => {
      onOpen(get, set, arg);
      set(isOpenAtom, true);
    };
    if (formRef?.isDirty()) {
      confirmUnsavedChanges(doOpen);
      return;
    }
    doOpen();
  });

  const closeAtom = atom(null, (get, set) => {
    const formRef = get(formRefAtom);
    const doClose = () => {
      onClose(set);
      set(isOpenAtom, false);
    };
    if (formRef?.isDirty()) {
      confirmUnsavedChanges(doClose);
      return;
    }
    doClose();
  });

  return { isOpenAtom, formRefAtom, openAtom, closeAtom };
}
