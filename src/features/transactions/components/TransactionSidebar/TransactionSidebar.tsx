import { ActionIcon, Group, Tooltip } from '@mantine/core';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { useMolecule } from 'bunshi/react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { Sidebar } from '~/shared/components/Sidebar';

import { TransactionSidebarForm } from './TransactionSidebarForm/TransactionSidebarForm';
import { TransactionSidebarMolecule } from './transactionSidebarMolecule';

export function TransactionSidebar({ width }: { width: number }) {
  const {
    isOpenAtom,
    editingIdAtom,
    closeAtom,
    navTargetsAtom,
    navigateToTransactionAtom,
  } = useMolecule(TransactionSidebarMolecule);
  const isOpen = useAtomValue(isOpenAtom);
  const editingId = useAtomValue(editingIdAtom);
  const navTargets = useAtomValue(navTargetsAtom);
  const close = useSetAtom(closeAtom);
  const navigate = useSetAtom(navigateToTransactionAtom);
  const { t } = useTranslation('transactions');

  const isEditing = editingId !== null && editingId !== undefined;

  const titleActions = isEditing ? (
    <Group gap={4} wrap="nowrap">
      <Tooltip label={t('sidebar.previous')}>
        <ActionIcon
          variant="subtle"
          color="gray"
          aria-label={t('sidebar.previous')}
          disabled={navTargets.prevId === null}
          onClick={() =>
            navTargets.prevId !== null && navigate(navTargets.prevId)
          }
        >
          <IconChevronUp size={18} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label={t('sidebar.next')}>
        <ActionIcon
          variant="subtle"
          color="gray"
          aria-label={t('sidebar.next')}
          disabled={navTargets.nextId === null}
          onClick={() =>
            navTargets.nextId !== null && navigate(navTargets.nextId)
          }
        >
          <IconChevronDown size={18} />
        </ActionIcon>
      </Tooltip>
    </Group>
  ) : undefined;

  return (
    <Sidebar
      isOpen={isOpen}
      onClose={close}
      title={editingId !== null ? t('sidebar.edit') : t('sidebar.add')}
      titleActions={titleActions}
      width={width}
    >
      <TransactionSidebarForm key={editingId ?? 'new'} />
    </Sidebar>
  );
}
