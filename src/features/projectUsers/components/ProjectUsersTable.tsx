import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Table,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { openConfirmModal } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconKey, IconPlus, IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useDeleteProjectUser } from '../queries';
import { getProjectUsersQueryOptions } from '../queries';
import type { ProjectUser } from '../schema';
import { CreateProjectUserModal } from './CreateProjectUserModal';
import { ResetPasswordModal } from './ResetPasswordModal';

export function ProjectUsersTable() {
  const { t } = useTranslation('projectUsers');
  const { data: users } = useQuery(getProjectUsersQueryOptions());
  const [createOpened, { open: openCreate, close: closeCreate }] =
    useDisclosure(false);
  const [resetPasswordUser, setResetPasswordUser] =
    useState<ProjectUser | null>(null);
  const deleteMutation = useDeleteProjectUser();

  function handleDelete(user: ProjectUser) {
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
    <>
      <Group justify="space-between" mb="md">
        <Title order={3}>{t('pageTitle')}</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          {t('addUser')}
        </Button>
      </Group>

      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t('columns.name')}</Table.Th>
            <Table.Th>{t('columns.email')}</Table.Th>
            <Table.Th>{t('columns.role')}</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {users?.map((user) => (
            <Table.Tr key={user.id}>
              <Table.Td>{user.name}</Table.Td>
              <Table.Td>
                <Text size="sm">{user.email}</Text>
              </Table.Td>
              <Table.Td>
                <Badge
                  color={user.role === 'admin' ? 'blue' : 'gray'}
                  variant="light"
                >
                  {t(`roles.${user.role}` as 'roles.admin' | 'roles.user')}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Group gap={4} justify="flex-end">
                  <Tooltip label={t('actions.resetPassword')}>
                    <ActionIcon
                      variant="subtle"
                      aria-label={t('actions.resetPassword')}
                      onClick={() => setResetPasswordUser(user)}
                    >
                      <IconKey size={16} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label={t('actions.delete')}>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      aria-label={t('actions.delete')}
                      onClick={() => handleDelete(user)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <CreateProjectUserModal opened={createOpened} onClose={closeCreate} />
      <ResetPasswordModal
        user={resetPasswordUser}
        onClose={() => setResetPasswordUser(null)}
      />
    </>
  );
}
