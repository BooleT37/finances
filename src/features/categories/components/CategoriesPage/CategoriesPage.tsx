import { Button, Group, Stack, Title } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useMolecule } from 'bunshi/react';
import { useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { CategoriesTable } from '~/features/categories/components/CategoriesTable/CategoriesTable';
import { CategorySidebar } from '~/features/categories/components/CategorySidebar/CategorySidebar';
import { CategorySidebarMolecule } from '~/features/categories/components/CategorySidebar/categorySidebarMolecule';

export function CategoriesPage() {
  const { t } = useTranslation('categories');
  const { openAtom } = useMolecule(CategorySidebarMolecule);
  const open = useSetAtom(openAtom);

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3}>{t('pageTitle')}</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => open(null)}>
          {t('addCategory')}
        </Button>
      </Group>
      <CategoriesTable />
      <CategorySidebar />
    </Stack>
  );
}
