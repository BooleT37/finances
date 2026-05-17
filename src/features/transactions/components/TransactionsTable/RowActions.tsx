import { ActionIcon, Group } from '@mantine/core';
import { modals, openConfirmModal } from '@mantine/modals';
import { IconCopy, IconEdit, IconTrash } from '@tabler/icons-react';
import { useMolecule } from 'bunshi/react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { TableFlash, useFlashTrigger } from '~/shared/hooks/useTableFlash';

import { TransactionSidebarMolecule } from '../TransactionSidebar/transactionSidebarMolecule';
import { CopyComponentsModal } from './CopyComponentsModal';

interface Props {
  id: number;
  parentExpenseId: number | null;
  name: string;
}

export function RowActions({ id, parentExpenseId, name }: Props) {
  const {
    openAtom,
    openForComponentAtom,
    deleteTransactionAtom,
    transactionsMapAtom,
    copyTransactionAtom,
  } = useMolecule(TransactionSidebarMolecule);
  const open = useSetAtom(openAtom);
  const openForComponent = useSetAtom(openForComponentAtom);
  const deleteTx = useSetAtom(deleteTransactionAtom);
  const copyTx = useSetAtom(copyTransactionAtom);
  const transactionsMap = useAtomValue(transactionsMapAtom);
  const triggerFlash = useFlashTrigger(TableFlash.Transactions);
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

  const doCopy = async ({ withComponents }: { withComponents: boolean }) => {
    const newId = await copyTx({ id, withComponents });
    if (newId !== undefined) {
      triggerFlash([newId]);
    }
  };

  const handleCopy = () => {
    const tx = transactionsMap.data?.[id];
    const hasComponents = (tx?.components.length ?? 0) > 0;

    if (!hasComponents) {
      void doCopy({ withComponents: false });
      return;
    }

    modals.open({
      title: t('copy.title'),
      children: (
        <CopyComponentsModal
          onYes={() => void doCopy({ withComponents: true })}
          onNo={() => void doCopy({ withComponents: false })}
        />
      ),
    });
  };

  return (
    <Group gap={4}>
      <ActionIcon
        variant="subtle"
        aria-label={t('actions.edit')}
        onClick={() =>
          parentExpenseId !== null
            ? openForComponent({ parentId: parentExpenseId, componentId: id })
            : open(id)
        }
      >
        <IconEdit size={16} />
      </ActionIcon>
      {parentExpenseId === null && (
        <ActionIcon
          variant="subtle"
          aria-label={t('actions.copy')}
          onClick={handleCopy}
        >
          <IconCopy size={16} />
        </ActionIcon>
      )}
      <ActionIcon
        variant="subtle"
        color="red"
        aria-label={t('actions.delete')}
        onClick={handleDelete}
      >
        <IconTrash size={16} />
      </ActionIcon>
    </Group>
  );
}
