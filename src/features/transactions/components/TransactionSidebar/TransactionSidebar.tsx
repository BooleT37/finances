import { useMolecule } from 'bunshi/react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { Sidebar } from '~/shared/components/Sidebar';

import { TransactionSidebarForm } from './TransactionSidebarForm/TransactionSidebarForm';
import { TransactionSidebarMolecule } from './transactionSidebarMolecule';

export function TransactionSidebar({ width }: { width: number }) {
  const { isOpenAtom, editingIdAtom, closeAtom } = useMolecule(
    TransactionSidebarMolecule,
  );
  const isOpen = useAtomValue(isOpenAtom);
  const editingId = useAtomValue(editingIdAtom);
  const close = useSetAtom(closeAtom);
  const { t } = useTranslation('transactions');

  return (
    <Sidebar
      isOpen={isOpen}
      onClose={close}
      title={editingId !== null ? t('sidebar.edit') : t('sidebar.add')}
      width={width}
    >
      <TransactionSidebarForm key={editingId ?? 'new'} />
    </Sidebar>
  );
}
