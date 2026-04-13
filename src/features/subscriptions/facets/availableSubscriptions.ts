import { useQuery } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { useAtomValue } from 'jotai';

import { getTransactionsQueryOptions } from '~/features/transactions/queries';
import {
  selectedMonthKeyAtom,
  selectedYearAtom,
  viewModeAtom,
} from '~/stores/month';

import { getSubscriptionsQueryOptions } from '../queries';
import type { Subscription } from '../schema';

export interface AvailableSubscription {
  subscription: Subscription;
  firstDate: Dayjs;
  /**
   * The transaction ID that paid this subscription in the selected period,
   * or null if unpaid.
   */
  transactionId: number | null;
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
): AvailableSubscription[] | undefined {
  const selectedMonth = useAtomValue(selectedMonthKeyAtom);
  const year = useAtomValue(selectedYearAtom);
  const viewMode = useAtomValue(viewModeAtom);
  const base = viewMode === 'year' ? dayjs(`${year}-01`) : dayjs(selectedMonth);
  const rangeStart = base.startOf(viewMode);
  const rangeEnd = base.endOf(viewMode);
  const { data: subscriptions } = useQuery(getSubscriptionsQueryOptions());
  const { data: transactions } = useQuery(getTransactionsQueryOptions(year));

  if (!subscriptions || !transactions) {
    return undefined;
  }

  const paidSubscriptionMap = new Map<number, number>(
    transactions
      .filter(
        (tx) =>
          tx.subscriptionId !== null &&
          !tx.date.isBefore(rangeStart, 'day') &&
          !tx.date.isAfter(rangeEnd, 'day'),
      )
      .map((tx) => [tx.subscriptionId as number, tx.id]),
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
      if (!date) {
        return null;
      }
      return {
        subscription,
        firstDate: date,
        transactionId: paidSubscriptionMap.get(subscription.id) ?? null,
      };
    })
    .filter((item): item is AvailableSubscription => item !== null);
}
