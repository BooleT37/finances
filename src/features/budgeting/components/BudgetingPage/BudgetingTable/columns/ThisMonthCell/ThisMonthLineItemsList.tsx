import { Anchor, Divider, Group, Stack, Text } from '@mantine/core';
import { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DATE_FORMAT } from '~/shared/constants';
import { costToString } from '~/shared/utils/costToString';

import type { ThisMonthLineItem } from './thisMonthLineItems';

const MAX_VISIBLE = 5;

export function ThisMonthLineItemsList({
  items,
}: {
  items: ThisMonthLineItem[];
}) {
  const { t } = useTranslation('budgeting');
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, MAX_VISIBLE);

  return (
    <Stack gap={4} mah={320} style={{ overflowY: 'auto' }}>
      {visible.map((item, index) => (
        <Fragment key={item.key}>
          {index > 0 && <Divider />}
          <Group justify="space-between" wrap="nowrap" gap="md">
            <Text size="xs" truncate style={{ flex: 1 }}>
              {item.name || t('thisMonthTransactions.noName')}
            </Text>
            <Group gap="xs" wrap="nowrap">
              <Text size="xs" style={{ whiteSpace: 'nowrap' }}>
                {costToString(item.cost)}
              </Text>
              <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                {item.date.format(DATE_FORMAT)}
              </Text>
            </Group>
          </Group>
        </Fragment>
      ))}
      {!expanded && items.length > MAX_VISIBLE && (
        <Anchor
          component="button"
          type="button"
          size="xs"
          onClick={() => setExpanded(true)}
        >
          {t('thisMonthTransactions.showMore', {
            count: items.length - MAX_VISIBLE,
          })}
        </Anchor>
      )}
    </Stack>
  );
}
