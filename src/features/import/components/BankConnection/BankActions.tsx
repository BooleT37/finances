import { ActionIcon, Tooltip } from '@mantine/core';
import { IconPlugConnected, IconPlugX, IconRefresh } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { bankHasConnector } from '~/features/import/bankCapabilities';
import type { Bank } from '~/generated/prisma/enums';

import { useBankConnection } from './useBankConnection';
import { useConnectBankAccount } from './useConnectBankAccount';
import { useDisconnectBankAccount } from './useDisconnectBankAccount';

interface Props {
  source: { id: number; name: string; bank: Bank | null };
}

export function BankActions({ source }: Props) {
  const { t } = useTranslation('import');
  const bankConnection = useBankConnection(source.id);
  const connectBankAccount = useConnectBankAccount();
  const disconnectBankAccount = useDisconnectBankAccount();

  if (!bankConnection) {
    if (!bankHasConnector(source.bank)) {
      return null;
    }
    return (
      <Tooltip label={t('bankConnections.connect')}>
        <ActionIcon
          variant="subtle"
          aria-label={t('bankConnections.connect')}
          loading={connectBankAccount.isPending}
          onClick={() => connectBankAccount.connect(source.id)}
        >
          <IconPlugConnected size={16} />
        </ActionIcon>
      </Tooltip>
    );
  }

  return (
    <>
      <Tooltip label={t('bankConnections.reconnect')}>
        <ActionIcon
          variant="subtle"
          aria-label={t('bankConnections.reconnect')}
          loading={connectBankAccount.isPending}
          onClick={() => connectBankAccount.connect(source.id)}
        >
          <IconRefresh size={16} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label={t('bankConnections.disconnect.action')}>
        <ActionIcon
          variant="subtle"
          color="red"
          aria-label={t('bankConnections.disconnect.action')}
          loading={disconnectBankAccount.isPending}
          onClick={() => disconnectBankAccount.disconnect(source)}
        >
          <IconPlugX size={16} />
        </ActionIcon>
      </Tooltip>
    </>
  );
}
