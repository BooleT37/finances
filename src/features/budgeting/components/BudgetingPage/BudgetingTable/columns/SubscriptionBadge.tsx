import { ActionIcon, Group, List, Stack, Text, Tooltip } from '@mantine/core';
import { openConfirmModal } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconRepeat } from '@tabler/icons-react';
import type { MRT_Row } from 'mantine-react-table';
import { useTranslation } from 'react-i18next';

import type { AvailableSubscription } from '~/features/subscriptions/facets/availableSubscriptions';
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

function TooltipContent({
  subs,
  paid,
  fromSubscriptions,
}: {
  subs: AvailableSubscription[];
  paid: string;
  fromSubscriptions: string;
}) {
  return (
    <Stack gap={4} data-testid="subscription-tooltip">
      <Text size="xs" fw={600}>
        {fromSubscriptions}
      </Text>
      {subs.length === 1 ? (
        <Text
          size="xs"
          c={subs[0]!.transactionId !== null ? 'dimmed' : undefined}
        >
          {subs[0]!.subscription.name}
          {subs[0]!.transactionId !== null ? ` (${paid})` : ''}
        </Text>
      ) : (
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
      )}
    </Stack>
  );
}

export function SubscriptionBadge({ row, month, year }: Props) {
  const { t } = useTranslation('budgeting');
  const bulkSave = useBulkSaveForecastsSum(month, year);

  const subs = row.original.subscriptions;
  if (subs.length === 0) {
    return null;
  }

  const total = decimalSum(...subs.map((s) => s.subscription.cost.abs()));

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
    <Tooltip
      label={
        <TooltipContent
          subs={subs}
          paid={t('subscriptions.paid')}
          fromSubscriptions={t('subscriptions.fromSubscriptions', {
            cost: costToString(total),
          })}
        />
      }
      withArrow
    >
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
    </Tooltip>
  );
}
