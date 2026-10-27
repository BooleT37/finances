import { ActionIcon, Group, Tooltip } from '@mantine/core';
import { openConfirmModal } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconTrash } from '@tabler/icons-react';
import { useRouteContext } from '@tanstack/react-router';
import type { MRT_Row } from 'mantine-react-table-open';
import { useTranslation } from 'react-i18next';

import { BankActions } from '~/features/import/components/BankConnection/BankActions';
import { useBankImportAvailable } from '~/features/import/components/BankConnection/useBankConnection';
import { useDeleteSource } from '~/features/sources/queries';
import type { Source } from '~/features/sources/schema';

interface Props {
  row: MRT_Row<Source>;
}

export function RowActions({ row }: Props) {
  const { t } = useTranslation('sources');
  const deleteSource = useDeleteSource();
  const { session } = useRouteContext({ from: '/_authenticated' });
  const bankImportAvailable = useBankImportAvailable();
  const showBankActions = bankImportAvailable && session.role === 'admin';

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
    <Group gap={4} wrap="nowrap">
      {showBankActions && <BankActions source={row.original} />}
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
