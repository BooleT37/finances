import { useMolecule } from 'bunshi/react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { Sidebar } from '~/shared/components/Sidebar';

import { CategorySidebarForm } from './CategorySidebarForm';
import { CategorySidebarMolecule } from './categorySidebarMolecule';

export function CategorySidebar() {
  const { isOpenAtom, editingIdAtom, closeAtom } = useMolecule(
    CategorySidebarMolecule,
  );
  const isOpen = useAtomValue(isOpenAtom);
  const editingId = useAtomValue(editingIdAtom);
  const close = useSetAtom(closeAtom);
  const { t } = useTranslation('categories');

  return (
    <Sidebar
      isOpen={isOpen}
      onClose={close}
      title={editingId !== null ? t('sidebar.edit') : t('sidebar.add')}
      width={380}
    >
      <CategorySidebarForm key={editingId ?? 'new'} />
    </Sidebar>
  );
}
