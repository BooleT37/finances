import { molecule } from 'bunshi';
import { atom } from 'jotai';
import { atomWithMutation, queryClientAtom } from 'jotai-tanstack-query';

import { API_DATE_FORMAT } from '~/shared/constants';

import { getUpdateSubscriptionMutationOptions } from '../../queries';
import type { Subscription } from '../../schema';
import { SubscriptionSidebarMolecule } from '../SubscriptionSidebar/subscriptionSidebarMolecule';

type FieldValue<T> = {
  [K in keyof T]: { field: K; value: T[K] };
}[keyof T];

type EditableSubscriptionField = 'name' | 'cost' | 'firstDate' | 'sourceId';

export const SubscriptionInlineEditMolecule = molecule((mol) => {
  const { editingIdAtom, formRefAtom } = mol(SubscriptionSidebarMolecule);

  const updateMutationAtom = atomWithMutation((get) =>
    getUpdateSubscriptionMutationOptions(get(queryClientAtom)),
  );

  const syncFieldToFormAtom = atom(
    null,
    (
      get,
      _set,
      patch: FieldValue<Pick<Subscription, EditableSubscriptionField>>,
    ) => {
      const form = get(formRefAtom);
      if (!form) {
        return;
      }
      switch (patch.field) {
        case 'name':
          form.setFieldValue('name', patch.value);
          break;
        case 'cost':
          form.setFieldValue('cost', patch.value.toString());
          break;
        case 'firstDate':
          form.setFieldValue('firstDate', patch.value);
          break;
        case 'sourceId':
          form.setFieldValue(
            'sourceId',
            patch.value === null ? null : String(patch.value),
          );
          break;
      }
      form.resetDirty();
    },
  );

  // Takes the full subscription (the table row already has it) rather than
  // an id + a map-atom lookup, since there's nothing else to fetch here.
  const updateInlineSubscriptionFieldAtom = atom(
    null,
    async (
      get,
      set,
      sub: Subscription,
      patch: FieldValue<Pick<Subscription, EditableSubscriptionField>>,
    ) => {
      const next = { ...sub, [patch.field]: patch.value } as Subscription;

      const updated = await get(updateMutationAtom).mutateAsync({
        id: next.id,
        name: next.name,
        cost: next.cost.toString(),
        period: next.period,
        firstDate: next.firstDate.format(API_DATE_FORMAT),
        active: next.active,
        categoryId: next.categoryId,
        subcategoryId: next.subcategoryId,
        sourceId: next.sourceId,
      });

      if (get(editingIdAtom) === sub.id) {
        set(syncFieldToFormAtom, patch);
      }

      return updated;
    },
  );

  return {
    updateInlineSubscriptionFieldAtom,
  };
});
