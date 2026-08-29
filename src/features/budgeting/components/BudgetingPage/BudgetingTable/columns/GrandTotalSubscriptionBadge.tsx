import { ActionIcon, Box, Group, HoverCard, Stack, Text } from '@mantine/core';
import { openConfirmModal } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconRepeat } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { getSourceMapQueryOptions } from '~/features/sources/facets/sourceMap';
import type { AvailableSubscription } from '~/features/subscriptions/facets/availableSubscriptions';
import { CostList } from '~/shared/components/CostList';
import { DATE_FORMAT } from '~/shared/constants';
import { costToString } from '~/shared/utils/costToString';
import { decimalSum } from '~/shared/utils/decimalSum';

import type { RowSubscriptions } from '../BudgetingTable.types';
import { countFilledRows } from '../fillPlans';
import { useApplyCategoryFillPlans } from '../useApplyCategoryFillPlans';

interface Props {
  subscriptions: RowSubscriptions;
  month: number;
  year: number;
}

export function GrandTotalSubscriptionBadge({
  subscriptions,
  month,
  year,
}: Props) {
  const { t } = useTranslation('budgeting');
  const applyPlans = useApplyCategoryFillPlans(month, year);
  const { data: sourceMap } = useQuery(getSourceMapQueryOptions());

  const { list: allDue, plans } = subscriptions;

  const paid = t('subscriptions.paid');
  const noSource = t('subscriptions.noSource');

  const groups = new Map<number | null, AvailableSubscription[]>();
  for (const item of allDue) {
    const key = item.subscription.sourceId;
    const existing = groups.get(key);
    if (existing) {
      existing.push(item);
    } else {
      groups.set(key, [item]);
    }
  }

  const grandTotal = decimalSum(...allDue.map((s) => s.subscription.cost));
  const fromSubscriptions = t('subscriptions.fromSubscriptions', {
    cost: costToString(grandTotal),
  });

  function handleClick() {
    openConfirmModal({
      title: t('subscriptions.fillFromSubscriptions'),
      children: t('subscriptions.fillFromSubscriptionsConfirm'),
      labels: {
        confirm: t('subscriptions.fillFromSubscriptions'),
        cancel: 'Отмена',
      },
      onConfirm: async () => {
        await applyPlans(plans.category, plans.subcategories);
        notifications.show({
          message: t('subscriptions.appliedGroup', {
            cost: costToString(grandTotal),
            count: countFilledRows(plans),
          }),
          color: 'green',
        });
      },
    });
  }

  return (
    <HoverCard width={300} position="bottom-start" withArrow shadow="md">
      <HoverCard.Target>
        <Group
          gap={2}
          wrap="nowrap"
          data-testid="subscription-badge"
          style={{
            border: '1px solid #ddd',
            borderRadius: 4,
            padding: '0 2px 0 0',
          }}
        >
          <ActionIcon
            variant="subtle"
            size="xs"
            color="gray"
            onClick={handleClick}
            aria-label={t('subscriptions.fillFromSubscriptions')}
          >
            <IconRepeat size={12} />
          </ActionIcon>
          <Text size="xs" c="dimmed">
            {costToString(grandTotal)}
          </Text>
        </Group>
      </HoverCard.Target>
      <HoverCard.Dropdown>
        <Stack gap={8} data-testid="grand-total-subscription-tooltip">
          <Text size="xs" fw={600}>
            {fromSubscriptions}
          </Text>
          {Array.from(groups.entries()).map(([sourceId, subs]) => {
            const sourceName =
              sourceId !== null && sourceMap
                ? (sourceMap[sourceId]?.name ?? noSource)
                : noSource;
            const groupTotal = decimalSum(
              ...subs.map((s) => s.subscription.cost),
            );
            const groupRemaining = decimalSum(
              ...subs
                .filter((s) => s.transactionId === null)
                .map((s) => s.subscription.cost),
            );
            return (
              <Stack key={String(sourceId)} gap={2}>
                <Group justify="space-between" wrap="nowrap" gap="md">
                  <Text size="xs" fw={500} truncate style={{ flex: 1 }}>
                    {sourceName}
                  </Text>
                  <Group gap={4} wrap="nowrap" style={{ whiteSpace: 'nowrap' }}>
                    <Text size="xs">{costToString(groupRemaining)}</Text>
                    <Text size="xs" c="dimmed">
                      / {costToString(groupTotal)}
                    </Text>
                  </Group>
                </Group>
                <Box pl="sm">
                  <CostList
                    items={subs.map((s) => ({
                      key: String(s.subscription.id),
                      name: `${s.subscription.name}${
                        s.transactionId !== null ? ` (${paid})` : ''
                      }`,
                      cost: s.subscription.cost,
                      extra: s.firstDate.format(DATE_FORMAT),
                      secondary: s.transactionId !== null,
                    }))}
                  />
                </Box>
              </Stack>
            );
          })}
        </Stack>
      </HoverCard.Dropdown>
    </HoverCard>
  );
}
