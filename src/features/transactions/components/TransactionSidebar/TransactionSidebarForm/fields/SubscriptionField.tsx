import { Select } from '@mantine/core';
import { useMolecule } from 'bunshi/react';
import { useAtomValue } from 'jotai';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useAvailableSubscriptions } from '~/features/subscriptions/facets/availableSubscriptions';
import { findByIdOrThrow } from '~/shared/utils/getOrThrow';

import { TransactionSidebarMolecule } from '../../transactionSidebarMolecule';
import type { TransactionFormType } from '../transactionFormValues';

interface Props {
  form: TransactionFormType;
}

export function SubscriptionField({ form }: Props) {
  const { t } = useTranslation('transactions');

  const { editingIdAtom } = useMolecule(TransactionSidebarMolecule);
  const editingId = useAtomValue(editingIdAtom);

  const activeCategory =
    form.values.transactionType === 'income'
      ? form.values.incomeCategory
      : form.values.expenseCategory;
  const availableSubscriptions = useAvailableSubscriptions(
    activeCategory !== null ? Number(activeCategory) : undefined,
  );

  const subscriptionOptions = useMemo(
    () =>
      (availableSubscriptions ?? [])
        .filter(
          (s) => s.transactionId === null || s.transactionId === editingId,
        )
        .map((s) => ({
          value: String(s.subscription.id),
          label: s.subscription.name,
        })),
    [availableSubscriptions, editingId],
  );

  const autofillSubscriptionFields = useCallback(
    (subscriptionId: string) => {
      if (!availableSubscriptions) {
        return;
      }
      const sub = findByIdOrThrow(
        availableSubscriptions.map((s) => s.subscription),
        Number(subscriptionId),
        'Subscription',
      );
      if (!form.values.name) {
        form.setFieldValue('name', sub.name);
      }
      if (!form.values.cost) {
        form.setFieldValue('cost', sub.cost.toString());
      }
      if (form.values.source === null && sub.sourceId !== null) {
        form.setFieldValue('source', String(sub.sourceId));
      }
    },
    [availableSubscriptions, form],
  );

  if (subscriptionOptions.length === 0) {
    return null;
  }

  return (
    <Select
      label={t('form.subscription')}
      data={subscriptionOptions}
      {...form.getInputProps('subscription')}
      clearable
      onChange={(v) => {
        form.setFieldValue('subscription', v);
        if (v !== null) {
          autofillSubscriptionFields(v);
        }
      }}
    />
  );
}
