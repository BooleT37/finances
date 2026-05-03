import { ActionIcon, Group, Tooltip } from '@mantine/core';
import { openConfirmModal } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
  IconArchive,
  IconArchiveOff,
  IconEdit,
  IconTrash,
} from '@tabler/icons-react';
import { useMolecule } from 'bunshi/react';
import { useSetAtom } from 'jotai';
import type { MRT_Row } from 'mantine-react-table';
import { useTranslation } from 'react-i18next';

import { SubscriptionSidebarMolecule } from '~/features/subscriptions/components/SubscriptionSidebar/subscriptionSidebarMolecule';
import {
  useDeleteSubscription,
  useUpdateSubscription,
} from '~/features/subscriptions/queries';
import type { Subscription } from '~/features/subscriptions/schema';

interface Props {
  row: MRT_Row<Subscription>;
  mode: 'active' | 'archived';
}

export function RowActions({ row, mode }: Props) {
  const { t } = useTranslation('subscriptions');
  const { openAtom } = useMolecule(SubscriptionSidebarMolecule);
  const open = useSetAtom(openAtom);
  const updateSubscription = useUpdateSubscription();
  const deleteSubscription = useDeleteSubscription();

  const {
    id,
    name,
    cost,
    period,
    firstDate,
    categoryId,
    subcategoryId,
    sourceId,
  } = row.original;

  const handleArchive = () => {
    updateSubscription.mutate(
      {
        id,
        name,
        cost: cost.abs().toString(),
        period,
        firstDate: firstDate.toISOString(),
        categoryId,
        subcategoryId,
        sourceId,
        active: false,
      },
      {
        onSuccess: () =>
          notifications.show({
            color: 'green',
            message: t('archiveAction.successMessage', { name }),
          }),
      },
    );
  };

  const handleUnarchive = () => {
    updateSubscription.mutate(
      {
        id,
        name,
        cost: cost.abs().toString(),
        period,
        firstDate: firstDate.toISOString(),
        categoryId,
        subcategoryId,
        sourceId,
        active: true,
      },
      {
        onSuccess: () =>
          notifications.show({
            color: 'green',
            message: t('archiveAction.unarchiveSuccess', { name }),
          }),
      },
    );
  };

  const handleDelete = () => {
    openConfirmModal({
      title: t('delete.confirmTitle'),
      children: t('delete.confirmMessage', { name }),
      labels: { confirm: t('delete.confirm'), cancel: t('delete.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: () =>
        deleteSubscription.mutate(id, {
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
      <Tooltip label={t('actions.edit')}>
        <ActionIcon
          variant="subtle"
          aria-label={t('actions.edit')}
          onClick={() => open(id)}
        >
          <IconEdit size={16} />
        </ActionIcon>
      </Tooltip>
      {mode === 'active' ? (
        <Tooltip label={t('actions.archive')}>
          <ActionIcon
            variant="subtle"
            aria-label={t('actions.archive')}
            onClick={handleArchive}
          >
            <IconArchive size={16} />
          </ActionIcon>
        </Tooltip>
      ) : (
        <Tooltip label={t('actions.unarchive')}>
          <ActionIcon
            variant="subtle"
            aria-label={t('actions.unarchive')}
            onClick={handleUnarchive}
          >
            <IconArchiveOff size={16} />
          </ActionIcon>
        </Tooltip>
      )}
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
