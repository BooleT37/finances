import { Modal } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import type { SavingSpending } from '../../schema';
import { SavingSpendingForm } from './SavingSpendingForm';

interface Props {
  opened: boolean;
  onClose: () => void;
  editItem: SavingSpending | null;
}

export function SavingSpendingModal({ opened, onClose, editItem }: Props) {
  const { t } = useTranslation('savingSpendings');

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={editItem ? t('modal.editTitle') : t('modal.createTitle')}
      closeOnClickOutside={false}
      closeOnEscape={false}
      size="xl"
    >
      <SavingSpendingForm editItem={editItem} onClose={onClose} />
    </Modal>
  );
}
