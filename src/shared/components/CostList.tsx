import { Anchor, Divider, Group, Stack, Text } from '@mantine/core';
import type { Dayjs } from 'dayjs';
import type Decimal from 'decimal.js';
import { Fragment, type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DATE_FORMAT } from '~/shared/constants';
import { costToString } from '~/shared/utils/costToString';

export interface CostListItem {
  key: string;
  name: string;
  cost: Decimal;
  date: Dayjs;
  /** Render the row dimmed (e.g. an already-paid subscription). */
  secondary?: boolean;
}

interface Props {
  items: CostListItem[];
  /** Optional bold header shown above the list. */
  title?: ReactNode;
  /**
   * When set, only this many items are shown with a "show more" link to reveal
   * the rest. When omitted, the whole list is rendered.
   */
  limit?: number;
}

/**
 * Renders a list of transactions/subscriptions for a HoverCard dropdown: each
 * row shows a name, cost, and date. Assumes a light (HoverCard) background — do
 * not put it in a dark `Tooltip`. Wrap it in a Mantine `HoverCard` yourself;
 * this component is only the dropdown content and contains no active elements
 * other than the optional "show more" link.
 */
export function CostList({ items, title, limit }: Props) {
  const { t } = useTranslation('common');
  const [expanded, setExpanded] = useState(false);
  const collapsed = limit !== undefined && !expanded && items.length > limit;
  const visible = collapsed ? items.slice(0, limit) : items;

  return (
    <Stack gap={4}>
      {title !== undefined && (
        <Text size="xs" fw={600}>
          {title}
        </Text>
      )}
      <Stack gap={4} mah={320} style={{ overflowY: 'auto' }}>
        {visible.map((item, index) => (
          <Fragment key={item.key}>
            {index > 0 && <Divider />}
            <Group justify="space-between" wrap="nowrap" gap="md">
              <Text
                size="xs"
                truncate
                style={{ flex: 1 }}
                c={item.secondary ? 'dimmed' : undefined}
              >
                {item.name}
              </Text>
              <Group gap="xs" wrap="nowrap">
                <Text
                  size="xs"
                  style={{ whiteSpace: 'nowrap' }}
                  c={item.secondary ? 'dimmed' : undefined}
                >
                  {costToString(item.cost)}
                </Text>
                <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                  {item.date.format(DATE_FORMAT)}
                </Text>
              </Group>
            </Group>
          </Fragment>
        ))}
      </Stack>
      {collapsed && (
        <Anchor
          component="button"
          type="button"
          size="xs"
          onClick={() => setExpanded(true)}
        >
          {t('showMore', { count: items.length - limit })}
        </Anchor>
      )}
    </Stack>
  );
}
