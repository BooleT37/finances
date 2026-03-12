import { ActionIcon, TextInput } from '@mantine/core';
import { IconList } from '@tabler/icons-react';
import { useMolecule } from 'bunshi/react';
import Decimal from 'decimal.js';
import { useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { ComponentsModal } from '../../../ComponentsModal/ComponentsModal';
import { TransactionSidebarMolecule } from '../../../transactionSidebarMolecule';
import type { TransactionFormType } from '../../transactionFormValues';
import { ComponentsHint } from './ComponentsHint';

const costRegex = /^-?\d+(?:\.\d+)?$/;

interface Props {
  form: TransactionFormType;
}

export function CostField({ form }: Props) {
  const { t } = useTranslation('transactions');
  const { componentsModalOpenAtom } = useMolecule(TransactionSidebarMolecule);
  const setComponentsModalOpen = useSetAtom(componentsModalOpenAtom);

  const isCostValid = costRegex.test(form.values.cost);
  const parentCost = isCostValid ? new Decimal(form.values.cost) : null;
  const activeCategory =
    form.values.transactionType === 'income'
      ? form.values.incomeCategory
      : form.values.expenseCategory;
  const activeSubcategory =
    form.values.transactionType === 'income'
      ? form.values.incomeSubcategory
      : form.values.expenseSubcategory;
  const parentCategoryId =
    activeCategory !== null ? Number(activeCategory) : null;
  const parentSubcategoryId =
    activeSubcategory !== null ? Number(activeSubcategory) : null;

  return (
    <>
      <TextInput
        label={t('form.amount')}
        required
        {...form.getInputProps('cost')}
        rightSection={
          form.values.transactionType !== 'fromSavings' ? (
            <ActionIcon
              variant="subtle"
              disabled={!isCostValid}
              onClick={() => setComponentsModalOpen(true)}
              title={t('components.editButton')}
            >
              <IconList size={16} />
            </ActionIcon>
          ) : undefined
        }
        rightSectionPointerEvents="all"
      />

      {parentCost !== null && (
        <ComponentsHint cost={parentCost} components={form.values.components} />
      )}

      <ComponentsModal
        parentCategoryId={parentCategoryId}
        parentSubcategoryId={parentSubcategoryId}
        parentCost={parentCost}
        components={form.values.components}
        onSave={(updated) => form.setFieldValue('components', updated)}
      />
    </>
  );
}
