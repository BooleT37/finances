import { useMolecule } from 'bunshi/react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { Sidebar } from '~/shared/components/Sidebar';
import { SidebarRowNavButtons } from '~/shared/components/SidebarRowNavButtons';

import { CategorySidebarForm } from './CategorySidebarForm';
import { CategorySidebarMolecule } from './categorySidebarMolecule';

export function CategorySidebar() {
  const {
    isOpenAtom,
    editingIdAtom,
    closeAtom,
    navTargetsAtom,
    navigateToCategoryAtom,
  } = useMolecule(CategorySidebarMolecule);
  const isOpen = useAtomValue(isOpenAtom);
  const editingId = useAtomValue(editingIdAtom);
  const navTargets = useAtomValue(navTargetsAtom);
  const close = useSetAtom(closeAtom);
  const navigate = useSetAtom(navigateToCategoryAtom);
  const { t } = useTranslation('categories');

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
      <CategorySidebarForm key={editingId ?? 'new'} />
    </Sidebar>
  );
}
