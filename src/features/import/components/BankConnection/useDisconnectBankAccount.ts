import { openConfirmModal } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';

import { useDisconnectBankConnection } from '~/features/import/queries';

export function useDisconnectBankAccount() {
  const { t } = useTranslation('import');
  const disconnectConnection = useDisconnectBankConnection();

  const disconnect = (source: { id: number; name: string }) =>
    openConfirmModal({
      title: t('bankConnections.disconnect.confirmTitle'),
      children: t('bankConnections.disconnect.confirmMessage', {
        name: source.name,
      }),
      labels: {
        confirm: t('bankConnections.disconnect.confirm'),
        cancel: t('bankConnections.disconnect.cancel'),
      },
      confirmProps: { color: 'red' },
      onConfirm: () =>
        disconnectConnection.mutate(
          { sourceId: source.id },
          {
            onSuccess: () =>
              notifications.show({
                color: 'green',
                message: t('bankConnections.disconnect.success', {
                  name: source.name,
                }),
              }),
            onError: () =>
              notifications.show({
                color: 'red',
                message: t('bankConnections.disconnect.failed'),
              }),
          },
        ),
    });

  return { disconnect, isPending: disconnectConnection.isPending };
}
