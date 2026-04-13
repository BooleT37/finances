import { ActionIcon, Group, List, Stack, Text, Tooltip } from '@mantine/core';
import { openConfirmModal } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconRepeat } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import type { MRT_Row } from 'mantine-react-table';
import { useTranslation } from 'react-i18next';

import { getSourceMapQueryOptions } from '~/features/sources/facets/sourceMap';
import type { AvailableSubscription } from '~/features/subscriptions/facets/availableSubscriptions';
import { costToString } from '~/shared/utils/costToString';
import { decimalSum } from '~/shared/utils/decimalSum';

import type { BudgetingRow } from '../BudgetingTable.types';
import { useBulkSaveForecastsSum } from '../useBulkSaveForecastsSum';
import { collectBulkItems } from './collectBulkItems';

interface Props {
  allDue: AvailableSubscription[];
  rows: MRT_Row<BudgetingRow>[];
  month: number;
  year: number;
}

export function GrandTotalSubscriptionBadge({
  allDue,
  rows,
  month,
  year,
}: Props) {
  const { t } = useTranslation('budgeting');
  const bulkSave = useBulkSaveForecastsSum(month, year);
  const { data: sourceMap } = useQuery(getSourceMapQueryOptions());

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

  const grandTotal = decimalSum(
    ...allDue.map((s) => s.subscription.cost.abs()),
  );
  const fromSubscriptions = t('subscriptions.fromSubscriptions', {
    cost: costToString(grandTotal),
  });

  const tooltipContent = (
    <Stack gap={4} data-testid="grand-total-subscription-tooltip">
      <Text size="xs" fw={600}>
        {fromSubscriptions}
      </Text>
      <List size="xs">
        {Array.from(groups.entries()).map(([sourceId, subs]) => {
          const sourceName =
            sourceId !== null && sourceMap
              ? (sourceMap[sourceId]?.name ?? noSource)
              : noSource;
          const groupTotal = decimalSum(
            ...subs.map((s) => s.subscription.cost.abs()),
          );

          return (
            <List.Item key={String(sourceId)}>
              <Text size="xs" fw={500}>
                {sourceName} — {costToString(groupTotal)}
              </Text>
              <List size="xs">
                {subs.map((s) => (
                  <List.Item key={s.subscription.id}>
                    <Text
                      size="xs"
                      c={s.transactionId !== null ? 'dimmed' : undefined}
                    >
                      {costToString(s.subscription.cost.abs())} —{' '}
                      {s.subscription.name}
                      {s.transactionId !== null ? ` (${paid})` : ''}
                    </Text>
                  </List.Item>
                ))}
              </List>
            </List.Item>
          );
        })}
      </List>
    </Stack>
  );

  function handleClick() {
    openConfirmModal({
      title: t('subscriptions.fillFromSubscriptions'),
      children: t('subscriptions.fillFromSubscriptionsConfirm'),
      labels: {
        confirm: t('subscriptions.fillFromSubscriptions'),
        cancel: 'Отмена',
      },
      onConfirm: () => {
        const items = rows.flatMap((typeGroupRow) =>
          (typeGroupRow.subRows ?? []).flatMap((categoryRow) =>
            collectBulkItems(categoryRow),
          ),
        );
        bulkSave(items);
        notifications.show({
          message: t('subscriptions.appliedGroup', {
            cost: costToString(grandTotal),
            count: items.length,
          }),
          color: 'green',
        });
      },
    });
  }

  return (
    <Tooltip label={tooltipContent} withArrow>
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
    </Tooltip>
  );
}
