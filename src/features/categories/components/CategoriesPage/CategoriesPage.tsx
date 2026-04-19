import { Button, Stack } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useMolecule } from 'bunshi/react';
import { useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { CategoriesTable } from '~/features/categories/components/CategoriesTable/CategoriesTable';
import { CategorySidebar } from '~/features/categories/components/CategorySidebar/CategorySidebar';
import { CategorySidebarMolecule } from '~/features/categories/components/CategorySidebar/categorySidebarMolecule';

const SIDEBAR_WIDTH = 380;

export function CategoriesPage() {
  const { t } = useTranslation('categories');
  const { openAtom } = useMolecule(CategorySidebarMolecule);
  const open = useSetAtom(openAtom);

  return (
    <Stack gap="md" style={{ paddingRight: SIDEBAR_WIDTH }}>
      <Button
        leftSection={<IconPlus size={16} />}
        onClick={() => open(null)}
        style={{ alignSelf: 'flex-start' }}
      >
        {t('addCategory')}
      </Button>
      <CategoriesTable />
      <CategorySidebar />
    </Stack>
  );
}
