/** A transaction, a component and a subscription can all carry the same
 *  number, so each kind of row id carries its own prefix. */
export type TransactionRowId = `transaction-${number}`;
export type ComponentRowId = `component-${number}`;
export type UpcomingSubscriptionRowId = `subscription-${number}`;

export type TransactionsRowId =
  | TransactionRowId
  | ComponentRowId
  | UpcomingSubscriptionRowId;

export function transactionRowId(id: number): TransactionRowId {
  return `transaction-${id}`;
}

export function componentRowId(id: number): ComponentRowId {
  return `component-${id}`;
}

export function upcomingSubscriptionRowId(
  subscriptionId: number,
): UpcomingSubscriptionRowId {
  return `subscription-${subscriptionId}`;
}
