import { Select } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getSavingSpendingMapQueryOptions } from '~/features/savingSpendings/facets/savingSpendingMap';
import { getSavingSpendingsQueryOptions } from '~/features/savingSpendings/queries';
import { findByIdOrThrow, getOrThrow } from '~/shared/utils/getOrThrow';

import type { TransactionFormType } from '../transactionFormValues';

interface Props {
  form: TransactionFormType;
  initialSavingSpendingId: string | null;
}

export function SavingSpendingFields({ form, initialSavingSpendingId }: Props) {
  const { t } = useTranslation('transactions');

  const { data: savingSpendings = [] } = useQuery(
    getSavingSpendingsQueryOptions(),
  );
  const { data: savingSpendingsMap } = useQuery(
    getSavingSpendingMapQueryOptions(),
  );

  const savingSpendingOptions = useMemo(() => {
    const active = savingSpendings.filter((s) => !s.completed);
    // Always keep the initial event (may be completed) so the user can re-select it
    const initialId = initialSavingSpendingId;
    if (initialId !== null && !active.some((s) => String(s.id) === initialId)) {
      active.unshift(
        findByIdOrThrow(savingSpendings, Number(initialId), 'SavingSpending'),
      );
    }
    return active.map((s) => ({ value: String(s.id), label: s.name }));
  }, [savingSpendings, initialSavingSpendingId]);

  const selectedSavingSpending = useMemo(
    () =>
      savingSpendings.find(
        (s) => String(s.id) === form.values.savingSpendingId,
      ) ?? null,
    [savingSpendings, form.values.savingSpendingId],
  );

  const savingSpendingCategoryOptions = useMemo(
    () =>
      (selectedSavingSpending?.categories ?? []).map((c) => ({
        value: String(c.id),
        label: c.name,
      })),
    [selectedSavingSpending],
  );

  const handleSavingSpendingChange = useCallback(
    (v: string | null) => {
      form.setFieldValue('savingSpendingId', v);
      form.setFieldValue('savingSpendingCategoryId', null);
      if (v !== null && savingSpendingsMap) {
        const event = getOrThrow(
          savingSpendingsMap,
          Number(v),
          'SavingSpending',
        );
        if (event?.categories.length === 1) {
          form.setFieldValue(
            'savingSpendingCategoryId',
            String(event.categories[0].id),
          );
        }
      }
    },
    [form, savingSpendingsMap],
  );

  return (
    <>
      <Select
        label={t('form.savingSpending')}
        required
        data={savingSpendingOptions}
        {...form.getInputProps('savingSpendingId')}
        onChange={handleSavingSpendingChange}
        searchable
      />
      {selectedSavingSpending !== null &&
        selectedSavingSpending.categories.length > 1 && (
          <Select
            label={t('form.savingSpendingCategory')}
            required
            data={savingSpendingCategoryOptions}
            {...form.getInputProps('savingSpendingCategoryId')}
            searchable
          />
        )}
    </>
  );
}
