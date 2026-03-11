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

  const availableSubscriptions = useAvailableSubscriptions(
    form.values.category !== null ? Number(form.values.category) : undefined,
    editingId,
  );

  const subscriptionOptions = useMemo(
    () =>
      (availableSubscriptions ?? []).map((s) => ({
        value: String(s.subscription.id),
        label: s.subscription.name,
      })),
    [availableSubscriptions],
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
      form.setFieldValue('name', sub.name);
      form.setFieldValue('cost', sub.cost.toString());
      form.setFieldValue(
        'source',
        sub.sourceId !== null ? String(sub.sourceId) : null,
      );
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
