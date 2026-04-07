import { Text, Tooltip } from '@mantine/core';
import Decimal from 'decimal.js';
import { useTranslation } from 'react-i18next';

import { costToString } from '~/shared/utils/costToString';

interface Props {
  average: Decimal;
  monthCount: number;
  prevYear: number;
  year: number;
}

export function AverageCell({ average, monthCount, prevYear, year }: Props) {
  const { t } = useTranslation('budgeting');
  if (monthCount === 0) {
    return (
      <Text size="sm" c="dimmed">
        —
      </Text>
    );
  }
  return (
    <Tooltip label={t('averageTooltip', { count: monthCount, prevYear, year })}>
      <Text size="sm">{costToString(average)}</Text>
    </Tooltip>
  );
}
