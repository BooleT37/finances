import { Anchor, Stack } from '@mantine/core';
import { useMolecule } from 'bunshi/react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { DatePickerWithTodayInput } from '~/shared/components/DatePickerWithTodayInput';
import { TextWithTooltipIcon } from '~/shared/components/TextWithTooltipIcon';

import { TransactionSidebarMolecule } from '../../transactionSidebarMolecule';
import type { TransactionFormType } from '../transactionFormValues';

interface Props {
  form: TransactionFormType;
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
          component="button"
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
    <Anchor
      component="button"
      size="xs"
      onClick={() => setActualDateShown(true)}
    >
      {t('form.actualDateDiffers')}
    </Anchor>
  );
}
