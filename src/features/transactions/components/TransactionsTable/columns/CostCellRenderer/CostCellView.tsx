import { Group, Text, Tooltip } from '@mantine/core';
import { IconCoinFilled, IconList } from '@tabler/icons-react';
import type Decimal from 'decimal.js';
import { useTranslation } from 'react-i18next';

import { costToString } from '~/shared/utils/costToString';

interface CostCellViewProps {
  cost: string;
  isSubscription?: boolean;
  isUpcomingSubscription?: boolean;
  parentExpenseName?: string;
  costWithComponents?: Decimal;
}

export function CostCellView({
  cost,
  isSubscription,
  isUpcomingSubscription,
  parentExpenseName,
  costWithComponents,
}: CostCellViewProps) {
  const { t } = useTranslation('transactions');

  return (
    <Group gap={4} wrap="nowrap">
      <Text span size="sm">
        {cost}
      </Text>
      {costWithComponents !== undefined && (
        <Tooltip label={t('costIncludingComponents')}>
          <Text span size="sm" c="dimmed">
            ({costToString(costWithComponents)})
          </Text>
        </Tooltip>
      )}
      {isSubscription && (
        <Tooltip
          label={
            isUpcomingSubscription
              ? t('upcomingSubscription')
              : t('subscription')
          }
        >
          <IconCoinFilled
            size={14}
            color="gray"
            role="img"
            aria-label={
              isUpcomingSubscription
                ? t('upcomingSubscription')
                : t('subscription')
            }
          />
        </Tooltip>
      )}
      {parentExpenseName !== undefined && (
        <Tooltip
          label={
            parentExpenseName
              ? t('componentOfExpenseTooltip', { name: parentExpenseName })
              : t('componentOfExpenseTooltipNoName')
          }
        >
          <IconList size={14} color="gray" />
        </Tooltip>
      )}
    </Group>
  );
}
