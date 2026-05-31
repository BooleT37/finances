import { ActionIcon, Group, HoverCard, Stack, Text } from '@mantine/core';
import { openConfirmModal } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconRepeat } from '@tabler/icons-react';
import type { MRT_Row } from 'mantine-react-table';
import { useTranslation } from 'react-i18next';

import { CostList } from '~/shared/components/CostList';
import { costToString } from '~/shared/utils/costToString';
import { decimalSum } from '~/shared/utils/decimalSum';

import type { BudgetingRow } from '../BudgetingTable.types';
import type { BulkItem } from '../useBulkSaveForecastsSum';
import { useBulkSaveForecastsSum } from '../useBulkSaveForecastsSum';
import { collectBulkItems } from './collectBulkItems';
import { isPlanCellLocked } from './isPlanCellLocked';

interface Props {
  row: MRT_Row<BudgetingRow>;
  month: number;
  year: number;
}

export function SubscriptionBadge({ row, month, year }: Props) {
  const { t } = useTranslation('budgeting');
  const bulkSave = useBulkSaveForecastsSum(month, year);

  const subs = row.original.subscriptions;
  if (subs.length === 0) {
    return null;
  }

  const total = decimalSum(...subs.map((s) => s.subscription.cost.abs()));
  const paid = t('subscriptions.paid');
  const fromSubscriptions = t('subscriptions.fromSubscriptions', {
    cost: costToString(total),
  });
  const subscriptionName = (s: (typeof subs)[number]) =>
    `${s.subscription.name}${s.transactionId !== null ? ` (${paid})` : ''}`;

  function applySubscriptions() {
    let items: BulkItem[];
    if (row.original.rowType === 'typeGroup') {
      items = [];
      for (const categoryRow of row.subRows ?? []) {
        items.push(...collectBulkItems(categoryRow));
      }
      bulkSave(items);
      notifications.show({
        message: t('subscriptions.appliedGroup', {
          cost: costToString(total),
          count: items.length,
        }),
        color: 'green',
      });
    } else {
      items = collectBulkItems(row);
      bulkSave(items);
      notifications.show({
        message: t('subscriptions.appliedSingle', {
          name: row.original.name,
          cost: costToString(total),
        }),
        color: 'green',
      });
    }
  }

  function handleClick() {
    const needsConfirm =
      row.original.rowType === 'typeGroup' || isPlanCellLocked(row.original);
    if (needsConfirm) {
      openConfirmModal({
        title: t('subscriptions.fillFromSubscriptions'),
        children: t('subscriptions.fillFromSubscriptionsConfirm'),
        labels: {
          confirm: t('subscriptions.fillFromSubscriptions'),
          cancel: 'Отмена',
        },
        onConfirm: applySubscriptions,
      });
    } else {
      applySubscriptions();
    }
  }

  return (
    <HoverCard width={280} position="bottom-start" withArrow shadow="md">
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
            {costToString(total)}
          </Text>
        </Group>
      </HoverCard.Target>
      <HoverCard.Dropdown>
        <div data-testid="subscription-tooltip">
          {subs.length === 1 ? (
            <Stack gap={4}>
              <Text size="xs" fw={600}>
                {fromSubscriptions}
              </Text>
              <Text
                size="xs"
                c={subs[0]!.transactionId !== null ? 'dimmed' : undefined}
              >
                {subscriptionName(subs[0]!)}
              </Text>
            </Stack>
          ) : (
            <CostList
              title={fromSubscriptions}
              items={subs.map((s) => ({
                key: String(s.subscription.id),
                name: subscriptionName(s),
                cost: s.subscription.cost.abs(),
                date: s.firstDate,
                secondary: s.transactionId !== null,
              }))}
            />
          )}
        </div>
      </HoverCard.Dropdown>
    </HoverCard>
  );
}
