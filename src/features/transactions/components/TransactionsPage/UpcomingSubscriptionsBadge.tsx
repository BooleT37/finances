import { Badge, Button, HoverCard, Stack } from '@mantine/core';
import { IconEye, IconEyeClosed, IconRepeat } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { useAvailableSubscriptions } from '~/features/subscriptions/facets/availableSubscriptions';
import { CostList } from '~/shared/components/CostList';

interface UpcomingSubscriptionsBadgeProps {
  showUpcoming: boolean;
  onToggle: () => void;
}

export function UpcomingSubscriptionsBadge({
  showUpcoming,
  onToggle,
}: UpcomingSubscriptionsBadgeProps) {
  const { t } = useTranslation('transactions');
  const availableSubscriptions = useAvailableSubscriptions();
  const unfilledSubscriptions =
    availableSubscriptions?.filter((a) => a.transactionId === null) ?? [];

  if (unfilledSubscriptions.length === 0) {
    return null;
  }

  return (
    <HoverCard width={280} position="bottom-start" withArrow shadow="md">
      <HoverCard.Target>
        <Badge
          variant="light"
          color="blue"
          radius="sm"
          leftSection={<IconRepeat size={12} />}
        >
          {t('upcomingBadge', { count: unfilledSubscriptions.length })}
        </Badge>
      </HoverCard.Target>
      <HoverCard.Dropdown>
        <Stack gap={8}>
          <CostList
            title={t('upcomingTooltipTitle', {
              count: unfilledSubscriptions.length,
            })}
            items={unfilledSubscriptions.map((a) => ({
              key: String(a.subscription.id),
              name: a.subscription.name,
              cost: a.subscription.cost.abs(),
              date: a.firstDate,
            }))}
          />
          <Button
            variant="subtle"
            size="xs"
            leftSection={
              showUpcoming ? <IconEyeClosed size={16} /> : <IconEye size={16} />
            }
            onClick={onToggle}
          >
            {showUpcoming ? t('hideFromTable') : t('showInTable')}
          </Button>
        </Stack>
      </HoverCard.Dropdown>
    </HoverCard>
  );
}
