import { useMolecule } from 'bunshi/react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { Sidebar } from '~/shared/components/Sidebar';

import { SubscriptionSidebarForm } from './SubscriptionSidebarForm';
import { SubscriptionSidebarMolecule } from './subscriptionSidebarMolecule';

export function SubscriptionSidebar() {
  const { isOpenAtom, editingIdAtom, closeAtom } = useMolecule(
    SubscriptionSidebarMolecule,
  );
  const isOpen = useAtomValue(isOpenAtom);
  const editingId = useAtomValue(editingIdAtom);
  const close = useSetAtom(closeAtom);
  const { t } = useTranslation('subscriptions');

  return (
    <Sidebar
      isOpen={isOpen}
      onClose={close}
      title={editingId !== null ? t('sidebar.edit') : t('sidebar.add')}
      width={380}
    >
      <SubscriptionSidebarForm key={editingId ?? 'new'} />
    </Sidebar>
  );
}
