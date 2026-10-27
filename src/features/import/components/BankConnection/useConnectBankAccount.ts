import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';

import { useStartBankAuth } from '~/features/import/queries';

export function useConnectBankAccount() {
  const { t } = useTranslation('import');
  const startAuth = useStartBankAuth();

  const connect = (sourceId: number) =>
    startAuth.mutate(
      { sourceId },
      {
        onSuccess: (url) => window.location.assign(url),
        onError: () =>
          notifications.show({
            color: 'red',
            message: t('bankConnections.startFailed'),
          }),
      },
    );

  return { connect, isPending: startAuth.isPending };
}
