import {
  Badge,
  Button,
  Divider,
  Group,
  HoverCard,
  Stack,
  Text,
} from '@mantine/core';
import { IconEye, IconEyeClosed, IconRepeat } from '@tabler/icons-react';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';

import { useAvailableSubscriptions } from '~/features/subscriptions/facets/availableSubscriptions';
import { DATE_FORMAT } from '~/shared/constants';

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
          <Text size="sm" fw={600}>
            {t('upcomingTooltipTitle', {
              count: unfilledSubscriptions.length,
            })}
          </Text>
          <Stack gap={4}>
            {unfilledSubscriptions.map((a, index) => (
              <Fragment key={a.subscription.id}>
                {index > 0 && <Divider />}
                <Group justify="space-between" wrap="nowrap" gap="md">
                  <Text size="sm">{a.subscription.name}</Text>
                  <Text size="sm" c="dimmed">
                    {a.firstDate.format(DATE_FORMAT)}
                  </Text>
                </Group>
              </Fragment>
            ))}
          </Stack>
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
