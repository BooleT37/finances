import { Input } from '@mantine/core';
import {
  IconMoneybagMinus,
  IconMoneybagPlus,
  IconPigMoney,
} from '@tabler/icons-react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { SegmentedControlWithIcons } from '~/shared/components/SegmentedControlWithIcons';

import type {
  TransactionFormType,
  TransactionType,
} from '../transactionFormValues';

interface Props {
  form: TransactionFormType;
}

export function TransactionTypeField({ form }: Props) {
  const { t } = useTranslation('transactions');

  const handleTypeChange = useCallback(
    (value: string) => {
      form.setFieldValue('transactionType', value as TransactionType);
      form.setFieldValue('category', null);
      form.setFieldValue('subcategory', null);
      form.setFieldValue('savingSpendingId', null);
      form.setFieldValue('savingSpendingCategoryId', null);
    },
    [form],
  );

  return (
    <Input.Wrapper label={t('form.type.label')}>
      <SegmentedControlWithIcons
        value={form.values.transactionType}
        onChange={handleTypeChange}
        data={[
          {
            label: t('form.type.expense'),
            value: 'expense',
            icon: <IconMoneybagMinus size={18} />,
          },
          {
            label: t('form.type.income'),
            value: 'income',
            icon: <IconMoneybagPlus size={18} />,
          },
          {
            label: t('form.type.fromSavings'),
            value: 'fromSavings',
            icon: <IconPigMoney size={18} />,
          },
        ]}
      />
    </Input.Wrapper>
  );
}
