import type Decimal from 'decimal.js';

import type { ForecastLineItem } from '~/features/budgeting/schema';

import type { BreakdownFormRow } from './BreakdownModal/BreakdownModal.utils';
import { breakdownTotal } from './BreakdownModal/BreakdownModal.utils';

export interface DueSubscription {
  subscriptionId: number;
  cost: Decimal;
  /** Already localised — this file has no opinion on wording. */
  comment: string;
}

export interface CurrentPlan {
  lineItems: ForecastLineItem[];
  sum: Decimal;
}

export function fillPlanFromSubscriptions(
  current: CurrentPlan,
  due: DueSubscription[],
): { rows: BreakdownFormRow[]; total: Decimal } {
  const dueById = new Map(due.map((sub) => [sub.subscriptionId, sub]));

  const rows: BreakdownFormRow[] = current.lineItems.map((item) => {
    const sub =
      item.subscriptionId === null
        ? undefined
        : dueById.get(item.subscriptionId);
    return {
      unitPrice: sub ? sub.cost.toString() : item.unitPrice,
      quantity: item.quantity.toString(),
      comment: item.comment,
      subscriptionId: item.subscriptionId,
    };
  });

  // Subscriptions are spending on top of what was planned, so a typed number
  // becomes a line of its own. Once the row has a plan its sum is only the
  // total of these lines, and moving it in would count it twice.
  if (current.lineItems.length === 0 && !current.sum.isZero()) {
    rows.push({
      unitPrice: current.sum.toString(),
      quantity: '1',
      comment: '',
      subscriptionId: null,
    });
  }

  const presentSubscriptions = new Set(
    current.lineItems.map((item) => item.subscriptionId),
  );
  for (const sub of due) {
    if (!presentSubscriptions.has(sub.subscriptionId)) {
      rows.push({
        unitPrice: sub.cost.toString(),
        quantity: '1',
        comment: sub.comment,
        subscriptionId: sub.subscriptionId,
      });
    }
  }

  return { rows, total: breakdownTotal(rows) };
}

export function areAllSubscriptionsApplied(
  current: CurrentPlan,
  due: DueSubscription[],
): boolean {
  if (due.length === 0) {
    return false;
  }
  const applied = new Set(current.lineItems.map((item) => item.subscriptionId));
  return due.every((sub) => applied.has(sub.subscriptionId));
}

export function hasAnySubscriptionAlreadyApplied(
  current: CurrentPlan,
  due: DueSubscription[],
): boolean {
  const applied = new Set(current.lineItems.map((item) => item.subscriptionId));
  return due.some((sub) => applied.has(sub.subscriptionId));
}
