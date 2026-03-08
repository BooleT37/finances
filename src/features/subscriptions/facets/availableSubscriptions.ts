import { useQuery } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { useAtomValue } from 'jotai';

import { getTransactionsQueryOptions } from '~/features/transactions/queries';
import { selectedMonthAtom, selectedYearAtom } from '~/stores/month';

import { getSubscriptionsQueryOptions } from '../queries';
import type { Subscription } from '../schema';

export interface AvailableSubscription {
  subscription: Subscription;
  firstDate: Dayjs;
}

function firstDateInInterval(
  firstDate: Dayjs,
  period: number,
  rangeStart: Dayjs,
  rangeEnd: Dayjs,
): Dayjs | null {
  let date = firstDate;
  while (date.isBefore(rangeStart, 'day')) {
    date = date.add(period, 'month');
  }
  if (!date.isAfter(rangeEnd, 'day')) {
    return date;
  }
  return null;
}

export function useAvailableSubscriptions(
  categoryId?: number,
  editingId?: number | null,
): AvailableSubscription[] | undefined {
  const selectedMonth = useAtomValue(selectedMonthAtom);
  const rangeStart = dayjs(selectedMonth).startOf('month');
  const rangeEnd = dayjs(selectedMonth).endOf('month');
  const year = useAtomValue(selectedYearAtom);
  const { data: subscriptions } = useQuery(getSubscriptionsQueryOptions());
  const { data: transactions } = useQuery(getTransactionsQueryOptions(year));

  if (!subscriptions || !transactions) {
    return undefined;
  }

  const paidSubscriptionIds = new Set(
    transactions
      .filter(
        (t) =>
          t.subscriptionId !== null &&
          t.id !== editingId &&
          !t.date.isBefore(rangeStart, 'day') &&
          !t.date.isAfter(rangeEnd, 'day'),
      )
      .map((t) => t.subscriptionId),
  );

  return subscriptions
    .filter((s) => s.active)
    .filter((s) => categoryId === undefined || s.categoryId === categoryId)
    .map((subscription): AvailableSubscription | null => {
      const date = firstDateInInterval(
        subscription.firstDate,
        subscription.period,
        rangeStart,
        rangeEnd,
      );
      return date ? { subscription, firstDate: date } : null;
    })
    .filter(
      (item): item is AvailableSubscription =>
        item !== null && !paidSubscriptionIds.has(item.subscription.id),
    );
}
