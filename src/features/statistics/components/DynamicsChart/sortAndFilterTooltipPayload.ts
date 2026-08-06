export interface DynamicsChartTooltipPayloadItem {
  name?: string | number;
  value?: unknown;
  payload?: Record<string, unknown>;
}

function getItemValue(item: DynamicsChartTooltipPayloadItem): number {
  const rawFromRow =
    item.name !== undefined && item.payload
      ? item.payload[item.name]
      : undefined;
  const value = typeof rawFromRow === 'number' ? rawFromRow : item.value;
  return typeof value === 'number' ? value : 0;
}

/**
 * The dynamics chart hover tooltip must not visually "jump" as the mouse
 * moves across months: sorting by value descending keeps the biggest
 * category on top consistently, and dropping zero-value entries keeps the
 * tooltip from growing/shrinking as categories with no activity that month
 * come and go.
 */
export function sortAndFilterTooltipPayload<
  T extends DynamicsChartTooltipPayloadItem,
>(payload: readonly T[]): T[] {
  return payload
    .filter((item) => getItemValue(item) !== 0)
    .sort((a, b) => getItemValue(b) - getItemValue(a));
}
