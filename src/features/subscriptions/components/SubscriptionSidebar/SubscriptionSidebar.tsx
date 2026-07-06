import { useMolecule } from 'bunshi/react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { Sidebar } from '~/shared/components/Sidebar';
import { SidebarRowNavButtons } from '~/shared/components/SidebarRowNavButtons';

import { SubscriptionSidebarForm } from './SubscriptionSidebarForm';
import { SubscriptionSidebarMolecule } from './subscriptionSidebarMolecule';

export function SubscriptionSidebar() {
  const {
    isOpenAtom,
    editingIdAtom,
    closeAtom,
    navTargetsAtom,
    navigateToSubscriptionAtom,
  } = useMolecule(SubscriptionSidebarMolecule);
  const isOpen = useAtomValue(isOpenAtom);
  const editingId = useAtomValue(editingIdAtom);
  const navTargets = useAtomValue(navTargetsAtom);
  const close = useSetAtom(closeAtom);
  const navigate = useSetAtom(navigateToSubscriptionAtom);
  const { t } = useTranslation('subscriptions');

  const isEditing = editingId !== null && editingId !== undefined;

  const titleActions = isEditing ? (
    <SidebarRowNavButtons
      prevId={navTargets.prevId}
      nextId={navTargets.nextId}
      onNavigate={navigate}
      previousLabel={t('sidebar.previous')}
      nextLabel={t('sidebar.next')}
    />
  ) : undefined;

  return (
    <Sidebar
      isOpen={isOpen}
      onClose={close}
      title={editingId !== null ? t('sidebar.edit') : t('sidebar.add')}
      titleActions={titleActions}
      width={380}
    >
      <SubscriptionSidebarForm key={editingId ?? 'new'} />
    </Sidebar>
  );
}
