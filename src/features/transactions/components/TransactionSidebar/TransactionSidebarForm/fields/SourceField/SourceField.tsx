import { Select } from '@mantine/core';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useOrderedSources } from '~/features/sources/facets/orderedSources';

import type { TransactionFormType } from '../../transactionFormValues';
import { SourceLastTransactions } from './SourceLastTransactions';

interface Props {
  form: TransactionFormType;
}

export function SourceField({ form }: Props) {
  const { t } = useTranslation('transactions');

  const orderedSources = useOrderedSources();

  const sourceOptions = useMemo(
    () =>
      (orderedSources ?? []).map((s) => ({
        value: String(s.id),
        label: s.name,
      })),
    [orderedSources],
  );

  const sourceDescription =
    form.values.source === null ? undefined : (
      <SourceLastTransactions sourceId={Number(form.values.source)} />
    );

  return (
    <Select
      label={t('form.source')}
      data={sourceOptions}
      {...form.getInputProps('source')}
      clearable
      description={sourceDescription}
    />
  );
}
