import type { UseFormReturnType } from '@mantine/form';
import { molecule } from 'bunshi';
import type { Getter, Setter } from 'jotai';
import { atom } from 'jotai';
import {
  atomWithMutation,
  atomWithQuery,
  queryClientAtom,
} from 'jotai-tanstack-query';

import { selectedYearAtom } from '~/stores/month';

import { getTransactionsMapByYear } from '../../facets/transactionMap';
import {
  getAddTransactionMutationOptions,
  getUpdateTransactionMutationOptions,
} from '../../queries';
import { confirmUnsavedChanges } from './confirmUnsavedChanges';
import type {
  TransactionComponentData,
  TransactionFormValues,
  ValidatedTransactionFormValues,
} from './TransactionSidebarForm/transactionFormValues';

export const TransactionSidebarMolecule = molecule(() => {
  // ── Selection / open state ────────────────────────────────────────────────
  // undefined = sidebar closed
  // null      = sidebar open, new transaction
  // number    = sidebar open, editing existing transaction
  const editingIdAtom = atom<number | null | undefined>(undefined);

  const isOpenAtom = atom((get) => get(editingIdAtom) !== undefined);

  const isNewTransactionAtom = atom((get) => get(editingIdAtom) === null);

  // ── Current transaction (from query cache) ────────────────────────────────
  const transactionsMapAtom = atomWithQuery((get) =>
    getTransactionsMapByYear(get(selectedYearAtom)),
  );

  const currentTransactionAtom = atom((get) => {
    const id = get(editingIdAtom);
    const result = get(transactionsMapAtom);
    if (id == null || !result.data) return null;
    return result.data[id] ?? null;
  });

  // ── Form state ────────────────────────────────────────────────────────────
  const currentComponentsAtom = atom<TransactionComponentData[]>([]);

  const actualDateShownAtom = atom(false);

  // ── Form ref (synced from component via useEffect) ────────────────────────
  const formRefAtom = atom<UseFormReturnType<TransactionFormValues> | null>(
    null,
  );

  // ── Actions ───────────────────────────────────────────────────────────────
  function doOpen(get: Getter, set: Setter, id: number | null) {
    set(editingIdAtom, id);

    if (id !== null) {
      const tx = get(transactionsMapAtom).data?.[id] ?? null;
      set(
        currentComponentsAtom,
        tx?.components.map((c) => ({
          id: c.id,
          name: c.name,
          cost: c.cost.toString(),
          categoryId: c.categoryId,
          subcategoryId: c.subcategoryId,
        })) ?? [],
      );
      set(actualDateShownAtom, tx?.actualDate != null);
    } else {
      set(currentComponentsAtom, []);
      set(actualDateShownAtom, false);
    }
  }

  const openAtom = atom(null, (get, set, id: number | null) => {
    const formRef = get(formRefAtom);
    if (formRef?.isDirty()) {
      confirmUnsavedChanges(() => doOpen(get, set, id));
      return;
    }
    doOpen(get, set, id);
  });

  const closeAtom = atom(null, (_get, set) => {
    set(editingIdAtom, undefined);
    set(currentComponentsAtom, []);
    set(actualDateShownAtom, false);
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
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

  const insertTransactionAtom = atom(
    null,
    async (get, _set, values: ValidatedTransactionFormValues) => {
      const editingId = get(editingIdAtom);
      const components = get(currentComponentsAtom);

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
    currentComponentsAtom,
    actualDateShownAtom,
    formRefAtom,
    openAtom,
    closeAtom,
    insertTransactionAtom,
  };
});
