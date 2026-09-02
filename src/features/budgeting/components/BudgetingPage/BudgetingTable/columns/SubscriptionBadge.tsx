import {
  ActionIcon,
  Group,
  HoverCard,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { openConfirmModal } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconRepeat } from '@tabler/icons-react';
import type { MRT_Row } from 'mantine-react-table-open';
import { useTranslation } from 'react-i18next';

import { CostList } from '~/shared/components/CostList';
import { DATE_FORMAT } from '~/shared/constants';
import { costToString } from '~/shared/utils/costToString';
import { decimalSum } from '~/shared/utils/decimalSum';

import type { BudgetingRow } from '../BudgetingTable.types';
import {
  countFilledRows,
  doesFillOverwriteExisting,
  isFillFullyApplied,
} from '../fillPlans';
import { useApplyCategoryFillPlans } from '../useApplyCategoryFillPlans';
import { hasAuthoritativeChildren } from './isPlanCellLocked';
import styles from './SubscriptionBadge.module.css';

interface Props {
  row: MRT_Row<BudgetingRow>;
  month: number;
  year: number;
}

export function SubscriptionBadge({ row, month, year }: Props) {
  const { t } = useTranslation('budgeting');
  const applyPlans = useApplyCategoryFillPlans(month, year);

  const { list: subs, plans } = row.original.subscriptions;
  if (subs.length === 0) {
    return null;
  }

  const total = decimalSum(...subs.map((s) => s.subscription.cost.abs()));
  const allApplied = isFillFullyApplied(plans);
  const paid = t('subscriptions.paid');
  const fromSubscriptions = t('subscriptions.fromSubscriptions', {
    cost: costToString(total),
  });
  const subscriptionName = (s: (typeof subs)[number]) =>
    `${s.subscription.name}${s.transactionId !== null ? ` (${paid})` : ''}`;

  async function applySubscriptions() {
    await applyPlans(plans.category, plans.subcategories);

    if (row.original.rowType === 'typeGroup') {
      notifications.show({
        message: t('subscriptions.appliedGroup', {
          cost: costToString(total),
          count: countFilledRows(plans),
        }),
        color: 'green',
      });
    } else {
      notifications.show({
        message: t('subscriptions.appliedSingle', {
          name: row.original.name,
          cost: costToString(total),
        }),
        color: 'green',
      });
    }
  }

  function confirmAndApply(children: string) {
    openConfirmModal({
      title: t('subscriptions.fillFromSubscriptions'),
      children,
      labels: {
        confirm: t('subscriptions.fillFromSubscriptions'),
        cancel: 'Отмена',
      },
      onConfirm: applySubscriptions,
    });
  }

  function handleClick() {
    if (
      row.original.rowType === 'typeGroup' ||
      hasAuthoritativeChildren(row.original)
    ) {
      confirmAndApply(t('subscriptions.fillFromSubscriptionsConfirm'));
    } else if (doesFillOverwriteExisting(plans)) {
      confirmAndApply(t('subscriptions.reapplyConfirm'));
    } else {
      void applySubscriptions();
    }
  }

  const iconLabel = allApplied
    ? t('subscriptions.refillFromSubscriptions')
    : t('subscriptions.fillFromSubscriptions');

  return (
    <Group
      gap={2}
      wrap="nowrap"
      data-testid="subscription-badge"
      className={allApplied ? styles.applied : undefined}
      style={{
        border: '1px solid #ddd',
        borderRadius: 4,
        padding: '0 2px 0 0',
      }}
    >
      <Tooltip label={iconLabel}>
        <ActionIcon
          variant="subtle"
          size="xs"
          color="gray"
          onClick={(event) => {
            // Without this, the click also bubbles to the parent plan
            // cell, whose own onClick opens the cell for editing right
            // after this button fills it, hiding the freshly-applied value.
            event.stopPropagation();
            handleClick();
          }}
          aria-label={iconLabel}
        >
          {allApplied ? (
            <>
              <IconCheck
                size={12}
                color="var(--mantine-color-green-7)"
                className={styles.tickIcon}
              />
              <IconRepeat size={12} className={styles.repeatIcon} />
            </>
          ) : (
            <IconRepeat size={12} />
          )}
        </ActionIcon>
      </Tooltip>
      <HoverCard width={280} position="bottom-start" withArrow shadow="md">
        <HoverCard.Target>
          <Text size="xs" c="dimmed" data-testid="subscription-cost">
            {costToString(total)}
          </Text>
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
                  extra: s.firstDate.format(DATE_FORMAT),
                  secondary: s.transactionId !== null,
                }))}
              />
            )}
          </div>
        </HoverCard.Dropdown>
      </HoverCard>
    </Group>
  );
}
