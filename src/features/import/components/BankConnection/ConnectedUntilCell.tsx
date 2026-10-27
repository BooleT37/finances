import { Text, Tooltip } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { DATE_FORMAT } from '~/shared/constants';
import { getToday } from '~/shared/utils/today';

import { useBankConnection } from './useBankConnection';

interface Props {
  sourceId: number;
}

export function ConnectedUntilCell({ sourceId }: Props) {
  const { t } = useTranslation('import');
  const connection = useBankConnection(sourceId);

  if (!connection) {
    return null;
  }

  const date = connection.expiresAt.format(DATE_FORMAT);

  if (connection.expiresAt.isBefore(getToday())) {
    return (
      <Tooltip label={t('bankConnections.expiredTooltip')}>
        <Text size="sm" c="red" span>
          {date}
        </Text>
      </Tooltip>
    );
  }

  if (!connection.hasAccount) {
    return (
      <Tooltip label={t('bankConnections.noAccountTooltip')}>
        <Text size="sm" c="orange" span>
          {date}
        </Text>
      </Tooltip>
    );
  }

  return (
    <Text size="sm" span>
      {date}
    </Text>
  );
}
