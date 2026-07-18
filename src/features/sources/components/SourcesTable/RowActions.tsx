import { ActionIcon, Group, Tooltip } from '@mantine/core';
import { openConfirmModal } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconTrash } from '@tabler/icons-react';
import type { MRT_Row } from 'mantine-react-table-open';
import { useTranslation } from 'react-i18next';

import { useDeleteSource } from '~/features/sources/queries';
import type { Source } from '~/features/sources/schema';

interface Props {
  row: MRT_Row<Source>;
}

export function RowActions({ row }: Props) {
  const { t } = useTranslation('sources');
  const deleteSource = useDeleteSource();

  const { id, name } = row.original;

  const handleDelete = () => {
    openConfirmModal({
      title: t('delete.confirmTitle'),
      children: t('delete.confirmMessage', { name }),
      labels: { confirm: t('delete.confirm'), cancel: t('delete.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: () =>
        deleteSource.mutate(id, {
          onSuccess: () =>
            notifications.show({
              color: 'green',
              message: t('delete.successMessage', { name }),
            }),
          onError: () =>
            notifications.show({
              color: 'red',
              message: t('delete.errorMessage'),
            }),
        }),
    });
  };

  return (
    <Group gap={4}>
      <Tooltip label={t('actions.delete')}>
        <ActionIcon
          variant="subtle"
          color="red"
          aria-label={t('actions.delete')}
          onClick={handleDelete}
        >
          <IconTrash size={16} />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}
