import { ActionIcon, Group } from '@mantine/core';
import { openConfirmModal } from '@mantine/modals';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { useMolecule } from 'bunshi/react';
import { useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { TransactionSidebarMolecule } from '../TransactionSidebar/transactionSidebarMolecule';

interface Props {
  id: number;
  parentExpenseId: number | null;
  name: string;
}

export function RowActions({ id, parentExpenseId, name }: Props) {
  const { openAtom, openForComponentAtom, deleteTransactionAtom } = useMolecule(
    TransactionSidebarMolecule,
  );
  const open = useSetAtom(openAtom);
  const openForComponent = useSetAtom(openForComponentAtom);
  const deleteTx = useSetAtom(deleteTransactionAtom);
  const { t } = useTranslation('transactions');

  const handleDelete = () => {
    openConfirmModal({
      title: t('delete.confirmTitle'),
      children: t('delete.confirmMessage', { name }),
      labels: { confirm: t('delete.confirm'), cancel: t('delete.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: () => void deleteTx(id),
    });
  };

  return (
    <Group gap={4}>
      <ActionIcon
        variant="subtle"
        onClick={() =>
          parentExpenseId !== null
            ? openForComponent({ parentId: parentExpenseId, componentId: id })
            : open(id)
        }
      >
        <IconEdit size={16} />
      </ActionIcon>
      <ActionIcon variant="subtle" color="red" onClick={handleDelete}>
        <IconTrash size={16} />
      </ActionIcon>
    </Group>
  );
}
