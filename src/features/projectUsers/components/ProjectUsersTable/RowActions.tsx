import { ActionIcon, Group, Tooltip } from '@mantine/core';
import { openConfirmModal } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconKey, IconTrash } from '@tabler/icons-react';
import type { MRT_Row } from 'mantine-react-table';
import { useTranslation } from 'react-i18next';

import { useDeleteProjectUser } from '~/features/projectUsers/queries';
import type { ProjectUser } from '~/features/projectUsers/schema';

interface Props {
  row: MRT_Row<ProjectUser>;
  onResetPassword: (user: ProjectUser) => void;
}

export function RowActions({ row, onResetPassword }: Props) {
  const { t } = useTranslation('projectUsers');
  const deleteMutation = useDeleteProjectUser();
  const user = row.original;

  function handleDelete() {
    openConfirmModal({
      title: t('delete.confirmTitle'),
      children: t('delete.confirmMessage', { name: user.name }),
      labels: { confirm: t('delete.confirm'), cancel: t('delete.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: () =>
        deleteMutation.mutate(user.id, {
          onSuccess: () =>
            notifications.show({
              color: 'green',
              message: t('delete.successMessage', { name: user.name }),
            }),
          onError: (error) =>
            notifications.show({
              color: 'red',
              message: error.message || t('delete.errorMessage'),
            }),
        }),
    });
  }

  return (
    <Group gap={4}>
      <Tooltip label={t('actions.resetPassword')}>
        <ActionIcon
          variant="subtle"
          aria-label={t('actions.resetPassword')}
          onClick={() => onResetPassword(user)}
        >
          <IconKey size={16} />
        </ActionIcon>
      </Tooltip>
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
