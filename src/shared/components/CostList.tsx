import { Anchor, Box, Divider, Stack, Text } from '@mantine/core';
import type Decimal from 'decimal.js';
import { Fragment, type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { costToString } from '~/shared/utils/costToString';

export interface CostListItem {
  key: string;
  name: string;
  cost: Decimal;
  extra?: string;
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
 * Renders a list of costed items for a HoverCard dropdown: each row shows a
 * name, a cost, and whatever `extra` detail the caller passes after it — a
 * formatted date for transactions and subscriptions, nothing at all for
 * forecast line items, which aren't dated. Assumes a light (HoverCard)
 * background — do not put it in a dark `Tooltip`. Wrap it in a Mantine
 * `HoverCard` yourself; this component is only the dropdown content and
 * contains no active elements other than the optional "show more" link.
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
      <Box
        mah={320}
        style={{
          display: 'grid',
          // The name takes the slack so the cost and extra columns line up
          // across rows; minmax(0, …) is what lets the name truncate.
          gridTemplateColumns: 'minmax(0, 1fr) auto auto',
          columnGap: 'var(--mantine-spacing-md)',
          rowGap: 4,
          alignItems: 'baseline',
          overflowY: 'auto',
        }}
      >
        {visible.map((item, index) => (
          <Fragment key={item.key}>
            {index > 0 && <Divider style={{ gridColumn: '1 / -1' }} />}
            <Text size="xs" truncate c={item.secondary ? 'dimmed' : undefined}>
              {item.name}
            </Text>
            <Text
              size="xs"
              ta="right"
              style={{ whiteSpace: 'nowrap' }}
              c={item.secondary ? 'dimmed' : undefined}
            >
              {costToString(item.cost)}
            </Text>
            {/* Always rendered, empty or not, so the grid keeps its columns. */}
            <Text
              size="xs"
              c="dimmed"
              ta="right"
              style={{ whiteSpace: 'nowrap' }}
            >
              {item.extra}
            </Text>
          </Fragment>
        ))}
      </Box>
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
