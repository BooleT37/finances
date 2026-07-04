import { molecule } from 'bunshi';
import { atom } from 'jotai';

import { API_DATE_FORMAT } from '~/shared/constants';

import type { Transaction, TransactionComponent } from '../../schema';
import { TransactionSidebarMolecule } from '../TransactionSidebar/transactionSidebarMolecule';

type FieldValue<T> = {
  [K in keyof T]: { field: K; value: T[K] };
}[keyof T];

type EditableTransactionField = 'cost' | 'name' | 'date' | 'sourceId';
type EditableComponentField = 'cost' | 'name';

export const TransactionInlineEditMolecule = molecule((mol) => {
  const {
    transactionsMapAtom,
    updateMutationAtom,
    editingIdAtom,
    formRefAtom,
  } = mol(TransactionSidebarMolecule);

  // Fetches the transaction by id, overlays `patch` onto it, and sends the
  // result to updateMutationAtom (which needs every field, not just the ones
  // changing). Not returned from the molecule — both inline-editing atoms
  // below funnel through it via `set`, while still spelling out at each call
  // site exactly which property they're changing.
  const updateTransactionWithPatchAtom = atom(
    null,
    async (get, _set, transactionId: number, patch: Partial<Transaction>) => {
      const tx = get(transactionsMapAtom).data?.[transactionId];
      if (!tx) {
        return undefined;
      }

      const nextTx = { ...tx, ...patch };

      return get(updateMutationAtom).mutateAsync({
        id: nextTx.id,
        name: nextTx.name,
        cost: nextTx.cost.toString(),
        date: nextTx.date.format(API_DATE_FORMAT),
        actualDate: nextTx.actualDate
          ? nextTx.actualDate.format(API_DATE_FORMAT)
          : null,
        categoryId: nextTx.categoryId,
        subcategoryId: nextTx.subcategoryId,
        sourceId: nextTx.sourceId,
        subscriptionId: nextTx.subscriptionId,
        savingSpendingCategoryId: nextTx.savingSpendingCategoryId,
        components: nextTx.components.map((c) => ({
          id: c.id,
          name: c.name,
          cost: c.cost.toString(),
          categoryId: c.categoryId,
          subcategoryId: c.subcategoryId,
        })),
      });
    },
  );

  // The open sidebar form's field names/shapes don't all mirror Transaction's
  // 1:1 (e.g. `source` holds a stringified sourceId, `date` is a native Date
  // for the DatePickerInput), so each editable field needs its own mapping
  // here rather than a generic `setFieldValue(field, value)`.
  const syncTransactionFieldToFormAtom = atom(
    null,
    (
      get,
      _set,
      patch: FieldValue<Pick<Transaction, EditableTransactionField>>,
    ) => {
      const form = get(formRefAtom);
      if (!form) {
        return;
      }
      switch (patch.field) {
        case 'cost':
          form.setFieldValue('cost', patch.value.toString());
          break;
        case 'name':
          form.setFieldValue('name', patch.value);
          break;
        case 'date':
          form.setFieldValue('date', patch.value.toDate());
          break;
        case 'sourceId':
          form.setFieldValue(
            'source',
            patch.value === null ? null : String(patch.value),
          );
          break;
      }
      form.resetDirty();
    },
  );

  const updateInlineTransactionFieldAtom = atom(
    null,
    async (
      get,
      set,
      transactionId: number,
      patch: FieldValue<Pick<Transaction, EditableTransactionField>>,
    ) => {
      const updated = await set(updateTransactionWithPatchAtom, transactionId, {
        [patch.field]: patch.value,
      } as Partial<Transaction>);
      if (!updated) {
        return undefined;
      }

      if (get(editingIdAtom) === transactionId) {
        set(syncTransactionFieldToFormAtom, patch);
      }

      return updated;
    },
  );

  const updateInlineComponentFieldAtom = atom(
    null,
    async (
      get,
      set,
      transactionId: number,
      componentId: number,
      patch: FieldValue<Pick<TransactionComponent, EditableComponentField>>,
    ) => {
      const tx = get(transactionsMapAtom).data?.[transactionId];
      if (!tx) {
        return undefined;
      }

      const components = tx.components.map((c) =>
        c.id === componentId
          ? ({ ...c, [patch.field]: patch.value } as TransactionComponent)
          : c,
      );

      const updated = await set(updateTransactionWithPatchAtom, transactionId, {
        components,
      });
      if (!updated) {
        return undefined;
      }

      if (get(editingIdAtom) === transactionId) {
        const form = get(formRefAtom);
        if (form) {
          const idx = form.values.components.findIndex(
            (c) => c.id === componentId,
          );
          if (idx !== -1) {
            switch (patch.field) {
              case 'cost':
                form.setFieldValue(
                  `components.${idx}.cost`,
                  patch.value.toString(),
                );
                break;
              case 'name':
                form.setFieldValue(`components.${idx}.name`, patch.value);
                break;
            }
          }
          form.resetDirty();
        }
      }

      return updated;
    },
  );

  return {
    transactionsMapAtom,
    updateInlineTransactionFieldAtom,
    updateInlineComponentFieldAtom,
  };
});
