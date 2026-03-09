import { Anchor, Stack } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { useMolecule } from 'bunshi/react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { DatePickerWithTodayInput } from '~/shared/components/DatePickerWithTodayInput';
import { TextWithTooltipIcon } from '~/shared/components/TextWithTooltipIcon';

import { TransactionSidebarMolecule } from '../../transactionSidebarMolecule';
import type { TransactionFormValues } from '../transactionFormValues';

interface Props {
  form: UseFormReturnType<TransactionFormValues>;
}

export function ActualDateField({ form }: Props) {
  const { actualDateShownAtom } = useMolecule(TransactionSidebarMolecule);
  const actualDateShown = useAtomValue(actualDateShownAtom);
  const setActualDateShown = useSetAtom(actualDateShownAtom);

  const { t } = useTranslation('transactions');

  if (actualDateShown) {
    return (
      <Stack gap={4}>
        <DatePickerWithTodayInput
          label={
            <TextWithTooltipIcon tooltip={t('form.actualDateDescription')}>
              {t('form.actualDate')}
            </TextWithTooltipIcon>
          }
          clearable
          {...form.getInputProps('actualDate')}
        />
        <Anchor
          size="xs"
          onClick={() => {
            setActualDateShown(false);
            form.setFieldValue('actualDate', null);
          }}
        >
          {t('form.sameDate')}
        </Anchor>
      </Stack>
    );
  }

  return (
    <Anchor size="xs" onClick={() => setActualDateShown(true)}>
      {t('form.actualDateDiffers')}
    </Anchor>
  );
}
