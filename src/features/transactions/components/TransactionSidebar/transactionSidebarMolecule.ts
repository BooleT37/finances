import { molecule } from 'bunshi';
import { atom } from 'jotai';
import {
  atomWithMutation,
  atomWithQuery,
  queryClientAtom,
} from 'jotai-tanstack-query';

import { selectedYearAtom } from '~/stores/month';
import {
  sidebarFormRefAtom,
  withDirtyCheckAtom,
} from '~/stores/sidebar/sidebarStore';

import { getTransactionsMapByYear } from '../../facets/transactionMap';
import {
  getAddTransactionMutationOptions,
  getDeleteTransactionMutationOptions,
  getUpdateTransactionMutationOptions,
} from '../../queries';
import type {
  TransactionFormType,
  TransformedTransactionFormValues,
} from './TransactionSidebarForm/transactionFormValues';

export const TransactionSidebarMolecule = molecule(() => {
  // ── Core state ──────────────────────────────────────────────────────────────
  const editingIdAtom = atom<number | null | undefined>(undefined);
  const isNewTransactionAtom = atom((get) => get(editingIdAtom) === null);

  const transactionsMapAtom = atomWithQuery((get) =>
    getTransactionsMapByYear(get(selectedYearAtom)),
  );

  const currentTransactionAtom = atom((get) => {
    const id = get(editingIdAtom);
    const result = get(transactionsMapAtom);
    if (id == null || !result.data) {
      return null;
    }
    return result.data[id] ?? null;
  });

  // ── Form state ──────────────────────────────────────────────────────────────
  const componentsModalOpenAtom = atom(false);
  const highlightedComponentIdAtom = atom<number | null>(null);
  const actualDateShownAtom = atom(false);
  const isOpenAtom = atom(false);

  const _formAtom = atom<TransactionFormType | null>(null);
  const formRefAtom = atom(
    (get) => get(_formAtom),
    (_get, set, value: TransactionFormType | null) => {
      set(_formAtom, value);
      set(sidebarFormRefAtom, value);
    },
  );

  // ── Open / close ────────────────────────────────────────────────────────────
  const openAtom = atom(null, (get, set, id: number | null) => {
    set(withDirtyCheckAtom, () => {
      set(editingIdAtom, id);
      if (id !== null) {
        const tx = get(transactionsMapAtom).data?.[id] ?? null;
        set(actualDateShownAtom, tx?.actualDate != null);
      } else {
        set(actualDateShownAtom, false);
      }
      set(isOpenAtom, true);
    });
  });

  const closeAtom = atom(null, (get, set) => {
    set(withDirtyCheckAtom, () => {
      get(_formAtom)?.reset();
      set(editingIdAtom, undefined);
      set(componentsModalOpenAtom, false);
      set(highlightedComponentIdAtom, null);
      set(actualDateShownAtom, false);
      set(isOpenAtom, false);
    });
  });

  // ── openForComponentAtom ────────────────────────────────────────────────────
  const openForComponentAtom = atom(
    null,
    (
      get,
      set,
      { parentId, componentId }: { parentId: number; componentId: number },
    ) => {
      set(withDirtyCheckAtom, () => {
        set(editingIdAtom, parentId);
        const tx = get(transactionsMapAtom).data?.[parentId] ?? null;
        set(actualDateShownAtom, tx?.actualDate != null);
        set(isOpenAtom, true);
        set(componentsModalOpenAtom, true);
        set(highlightedComponentIdAtom, componentId);
        setTimeout(() => set(highlightedComponentIdAtom, null), 3500);
      });
    },
  );

  // ── Mutations ───────────────────────────────────────────────────────────────
  const addMutationAtom = atomWithMutation((get) =>
    getAddTransactionMutationOptions(
      get(queryClientAtom),
      get(selectedYearAtom),
    ),
  );

  const updateMutationAtom = atomWithMutation((get) =>
    getUpdateTransactionMutationOptions(
      get(queryClientAtom),
      get(selectedYearAtom),
    ),
  );

  const deleteMutationAtom = atomWithMutation((get) =>
    getDeleteTransactionMutationOptions(
      get(queryClientAtom),
      get(selectedYearAtom),
    ),
  );

  const deleteTransactionAtom = atom(null, (get, set, id: number) => {
    get(deleteMutationAtom).mutate(id, {
      onSuccess: () => {
        if (get(editingIdAtom) === id) {
          set(editingIdAtom, undefined);
          set(componentsModalOpenAtom, false);
          set(highlightedComponentIdAtom, null);
          set(actualDateShownAtom, false);
          set(isOpenAtom, false);
        }
      },
    });
  });

  const saveTransactionAtom = atom(
    null,
    async (get, _set, values: TransformedTransactionFormValues) => {
      const editingId = get(editingIdAtom);
      const components = values.components;

      const componentInputs =
        components.length > 0
          ? components.map((c) => ({
              id: c.id,
              name: c.name,
              cost: c.cost,
              categoryId: c.categoryId,
              subcategoryId: c.subcategoryId,
            }))
          : undefined;

      const commonFields = {
        name: values.name,
        cost: values.cost,
        date: values.date.toISOString(),
        actualDate: values.actualDate?.toISOString() ?? null,
        categoryId: Number(values.category),
        subcategoryId:
          values.subcategory !== null ? Number(values.subcategory) : null,
        sourceId: values.source !== null ? Number(values.source) : null,
        subscriptionId:
          values.subscription !== null ? Number(values.subscription) : null,
        savingSpendingCategoryId:
          values.savingSpendingCategoryId !== null
            ? Number(values.savingSpendingCategoryId)
            : null,
        components: componentInputs,
      };

      if (editingId != null) {
        return await get(updateMutationAtom).mutateAsync({
          ...commonFields,
          id: editingId,
        });
      } else {
        return await get(addMutationAtom).mutateAsync(commonFields);
      }
    },
  );

  return {
    editingIdAtom,
    isOpenAtom,
    isNewTransactionAtom,
    currentTransactionAtom,
    componentsModalOpenAtom,
    actualDateShownAtom,
    formRefAtom,
    openAtom,
    openForComponentAtom,
    highlightedComponentIdAtom,
    closeAtom,
    saveTransactionAtom,
    deleteTransactionAtom,
  };
});
