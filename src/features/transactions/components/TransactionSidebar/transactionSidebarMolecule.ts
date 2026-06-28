import { molecule } from 'bunshi';
import dayjs from 'dayjs';
import { atom } from 'jotai';
import {
  atomWithMutation,
  atomWithQuery,
  queryClientAtom,
} from 'jotai-tanstack-query';

import { API_DATE_FORMAT, DATE_FORMAT } from '~/shared/constants';
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
import type { TransactionTableItem } from '../TransactionsTable/TransactionsTable.types';
import type {
  TransactionFormType,
  TransformedTransactionFormValues,
} from './TransactionSidebarForm/transactionFormValues';
import { emptyTransactionFormValuesAtom } from './TransactionSidebarForm/TransactionSidebarForm.atoms';

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

  // ── Row navigation ────────────────────────────────────────────────────────
  // The table publishes the visible leaf rows adjacent to the focused one so the
  // sidebar's up/down buttons know where to go (null when there is none).
  const navTargetsAtom = atom<{ prevId: number | null; nextId: number | null }>(
    { prevId: null, nextId: null },
  );
  // Bumped to ask the table to scroll the focused row into view. Used for
  // arrow-nav and component edits; a plain edit-click does not request a scroll.
  const scrollRequestAtom = atom<{ id: number; token: number } | null>(null);
  const requestScrollAtom = atom(null, (get, set, id: number) => {
    set(scrollRequestAtom, {
      id,
      token: (get(scrollRequestAtom)?.token ?? 0) + 1,
    });
  });

  const _formAtom = atom<TransactionFormType | null>(null);
  const formRefAtom = atom(
    (get) => get(_formAtom),
    (_get, set, value: TransactionFormType | null) => {
      set(_formAtom, value);
      set(sidebarFormRefAtom, value);
    },
  );

  // ── Open / close ────────────────────────────────────────────────────────────

  // Inner open logic without a dirty check — used directly when the caller has
  // already confirmed (or there is nothing to confirm), e.g. inside
  // createFromSubscriptionAtom after the mutation completes.
  const openDirectAtom = atom(null, (get, set, id: number | null) => {
    set(editingIdAtom, id);
    if (id !== null) {
      const tx = get(transactionsMapAtom).data?.[id] ?? null;
      set(actualDateShownAtom, tx?.actualDate != null);
    } else {
      set(actualDateShownAtom, false);
      // For the existing transaction path, we have the "key" workaround on the component,
      // That remounts it on transaction id update. For the new transaction it won't work since the key
      // is always "new". If we put the date or month in the key, it will remount on every date or month
      // change respectfully, which we don't want. So to avoid bugs with initial transaction values not being
      // reset after we close and reopen the sidebar, we need to do it manually
      const form = get(_formAtom);
      if (form) {
        form.setInitialValues(get(emptyTransactionFormValuesAtom));
        form.reset();
      }
    }
    set(isOpenAtom, true);
  });

  const openAtom = atom(null, (_get, set, id: number | null) => {
    set(withDirtyCheckAtom, () => {
      set(openDirectAtom, id);
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
        set(requestScrollAtom, parentId);
        setTimeout(() => set(highlightedComponentIdAtom, null), 3500);
      });
    },
  );

  // Move the edited transaction to an adjacent visible row (arrow buttons).
  // Routes through the dirty-check so a dirty/invalid form prompts to confirm.
  const navigateToTransactionAtom = atom(null, (get, set, id: number) => {
    set(withDirtyCheckAtom, () => {
      set(editingIdAtom, id);
      const tx = get(transactionsMapAtom).data?.[id] ?? null;
      set(actualDateShownAtom, tx?.actualDate != null);
      set(componentsModalOpenAtom, false);
      set(highlightedComponentIdAtom, null);
      set(isOpenAtom, true);
      set(requestScrollAtom, id);
    });
  });

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
        // Expense.date is @db.Date; serialize as a calendar date in the user's
        // local timezone so toISOString's UTC shift doesn't bump the row to
        // the previous day for positive-offset zones.
        date: dayjs(values.date).format(API_DATE_FORMAT),
        actualDate: values.actualDate
          ? dayjs(values.actualDate).format(API_DATE_FORMAT)
          : null,
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

  // ── Copy ────────────────────────────────────────────────────────────────────
  const copyTransactionAtom = atom(
    null,
    async (
      get,
      set,
      { id, withComponents }: { id: number; withComponents: boolean },
    ): Promise<number | undefined> => {
      const tx = get(transactionsMapAtom).data?.[id];
      if (!tx) {
        return undefined;
      }

      const newTx = await get(addMutationAtom).mutateAsync({
        name: tx.name,
        cost: tx.cost.abs().toString(),
        date: tx.date.format(API_DATE_FORMAT),
        actualDate: tx.actualDate
          ? tx.actualDate.format(API_DATE_FORMAT)
          : null,
        categoryId: tx.categoryId,
        subcategoryId: tx.subcategoryId ?? null,
        sourceId: tx.sourceId ?? null,
        subscriptionId: null,
        savingSpendingCategoryId: tx.savingSpendingCategoryId ?? null,
        components:
          withComponents && tx.components.length > 0
            ? tx.components.map((c) => ({
                name: c.name,
                cost: c.cost.abs().toString(),
                categoryId: c.categoryId,
                subcategoryId: c.subcategoryId ?? null,
              }))
            : undefined,
      });

      set(openAtom, newTx.id);
      set(requestScrollAtom, newTx.id);
      return newTx.id;
    },
  );

  const createFromSubscriptionAtom = atom(
    null,
    (
      _get,
      set,
      {
        row,
        onCreated,
      }: { row: TransactionTableItem; onCreated?: (id: number) => void },
    ) => {
      set(withDirtyCheckAtom, () => {
        if (!row.subscriptionId || !row.cost) {
          return;
        }
        void (async () => {
          const newTx = await _get(addMutationAtom).mutateAsync({
            name: row.name,
            cost: row.cost!.cost.abs().toString(),
            date: dayjs(row.date, DATE_FORMAT).format(API_DATE_FORMAT),
            actualDate: null,
            categoryId: row.categoryId,
            subcategoryId: row.subcategoryId ?? null,
            sourceId: row.sourceId ?? null,
            subscriptionId: row.subscriptionId!,
            savingSpendingCategoryId: null,
            components: undefined,
          });
          // React Query's notifyManager dispatches observer updates via setTimeout(0),
          // so transactionsMapAtom is not yet updated when mutateAsync resolves.
          // Deferring to the next tick ensures the form initializes with the new
          // transaction's data rather than empty values.
          setTimeout(() => {
            set(openDirectAtom, newTx.id);
            set(requestScrollAtom, newTx.id);
            onCreated?.(newTx.id);
          }, 0);
        })();
      });
    },
  );

  return {
    editingIdAtom,
    isOpenAtom,
    isNewTransactionAtom,
    currentTransactionAtom,
    transactionsMapAtom,
    componentsModalOpenAtom,
    actualDateShownAtom,
    formRefAtom,
    openAtom,
    openForComponentAtom,
    highlightedComponentIdAtom,
    closeAtom,
    saveTransactionAtom,
    deleteTransactionAtom,
    copyTransactionAtom,
    createFromSubscriptionAtom,
    navTargetsAtom,
    scrollRequestAtom,
    navigateToTransactionAtom,
  };
});
