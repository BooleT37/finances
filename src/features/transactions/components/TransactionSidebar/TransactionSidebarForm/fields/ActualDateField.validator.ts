import { useMolecule } from 'bunshi/react';
import dayjs from 'dayjs';
import { useAtomValue } from 'jotai';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { TransactionSidebarMolecule } from '../../transactionSidebarMolecule';
import type { TransactionFormValues } from '../transactionFormValues';

export function useActualDateValidator() {
  const { t } = useTranslation('transactions');
  const { actualDateShownAtom } = useMolecule(TransactionSidebarMolecule);
  const actualDateShown = useAtomValue(actualDateShownAtom);

  return useCallback(
    (value: string | null, values: TransactionFormValues): string | null => {
      if (!actualDateShown || !value || !values.date) {
        return null;
      }
      return dayjs(value).isSame(values.date, 'day')
        ? t('form.errors.actualDateSameAsDate')
        : null;
    },
    [actualDateShown, t],
  );
}
