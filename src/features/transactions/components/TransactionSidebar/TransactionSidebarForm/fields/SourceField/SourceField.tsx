import { Select } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getSourcesQueryOptions } from '~/features/sources/queries';

import type { TransactionFormValues } from '../../transactionFormValues';
import { SourceLastTransactions } from './SourceLastTransactions';

interface Props {
  form: UseFormReturnType<TransactionFormValues>;
}

export function SourceField({ form }: Props) {
  const { t } = useTranslation('transactions');

  const { data: sources = [] } = useQuery(getSourcesQueryOptions());

  const sourceOptions = useMemo(
    () => sources.map((s) => ({ value: String(s.id), label: s.name })),
    [sources],
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
