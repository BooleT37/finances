import { Modal } from '@mantine/core';
import { useMolecule } from 'bunshi/react';
import type Decimal from 'decimal.js';
import { useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import type { CategorySubcategoryId } from '~/features/categories/categorySubcategoryId';

import type { TransactionComponentData } from '../TransactionSidebarForm/transactionFormValues';
import { TransactionSidebarMolecule } from '../transactionSidebarMolecule';
import { ComponentsModalForm } from './ComponentsModalForm';

export interface ComponentFormRow {
  id?: number;
  name: string;
  cost: string;
  categoryId: CategorySubcategoryId | null;
}

export interface ComponentFormRowValidated extends ComponentFormRow {
  categoryId: CategorySubcategoryId;
}

export interface ComponentsFormValues {
  components: ComponentFormRow[];
}

export interface ComponentsFormValuesValidated {
  components: ComponentFormRowValidated[];
}

interface Props {
  parentCategoryId: number | null;
  parentSubcategoryId: number | null;
  parentCost: Decimal | null;
  components: TransactionComponentData[];
  onSave: (components: TransactionComponentData[]) => void;
}

export function ComponentsModal({
  parentCategoryId,
  parentSubcategoryId,
  parentCost,
  components,
  onSave,
}: Props) {
  const { t } = useTranslation('transactions');

  const { componentsModalOpenAtom } = useMolecule(TransactionSidebarMolecule);
  const open = useAtomValue(componentsModalOpenAtom);
  const setOpen = useSetAtom(componentsModalOpenAtom);

  return (
    <Modal
      opened={open}
      onClose={() => setOpen(false)}
      title={t('components.modalTitle')}
      keepMounted={false}
      size="lg"
    >
      <ComponentsModalForm
        parentCategoryId={parentCategoryId}
        parentSubcategoryId={parentSubcategoryId}
        parentCost={parentCost}
        components={components}
        onSave={onSave}
        onClose={() => setOpen(false)}
      />
    </Modal>
  );
}
