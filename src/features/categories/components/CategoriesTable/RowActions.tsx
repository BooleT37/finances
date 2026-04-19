import { Group, Tooltip } from '@mantine/core';
import { openConfirmModal } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { useMolecule } from 'bunshi/react';
import { useSetAtom } from 'jotai';
import type { MRT_Row } from 'mantine-react-table';
import { useTranslation } from 'react-i18next';

import { CategorySidebarMolecule } from '~/features/categories/components/CategorySidebar/categorySidebarMolecule';
import { useDeleteCategory } from '~/features/categories/queries';
import type { Category } from '~/features/categories/schema';

interface Props {
  row: MRT_Row<Category>;
}

export function RowActions({ row }: Props) {
  const { t } = useTranslation('categories');
  const { openAtom, closeAtom } = useMolecule(CategorySidebarMolecule);
  const open = useSetAtom(openAtom);
  const close = useSetAtom(closeAtom);
  const deleteCategory = useDeleteCategory();

  const isSpecial = row.original.type !== null;

  const handleDelete = () => {
    openConfirmModal({
      title: t('delete.confirmTitle'),
      children: t('delete.confirmMessage', { name: row.original.name }),
      labels: { confirm: t('delete.confirm'), cancel: t('delete.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        deleteCategory.mutate(row.original.id, {
          onSuccess: () => {
            close();
            notifications.show({
              color: 'green',
              message: t('delete.successMessage', { name: row.original.name }),
            });
          },
          onError: () =>
            notifications.show({
              color: 'red',
              message: t('delete.errorMessage'),
            }),
        });
      },
    });
  };

  return (
    <Group gap={16} wrap="nowrap">
      <Tooltip label={t('actions.edit')}>
        <IconEdit
          size={18}
          style={{ cursor: 'pointer' }}
          onClick={() => open(row.original.id)}
        />
      </Tooltip>
      <Tooltip
        label={isSpecial ? t('delete.disabledTooltip') : t('actions.delete')}
      >
        <span>
          <IconTrash
            size={18}
            color="red"
            style={{
              cursor: isSpecial ? 'not-allowed' : 'pointer',
              opacity: isSpecial ? 0.4 : 1,
            }}
            onClick={isSpecial ? undefined : handleDelete}
          />
        </span>
      </Tooltip>
    </Group>
  );
}
