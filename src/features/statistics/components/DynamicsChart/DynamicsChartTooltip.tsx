import { ColorSwatch, Group, Paper, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import type { TooltipPayloadEntry } from 'recharts';

import { NameWithOptionalIcon } from '~/features/categories/components/NameWithOptionalIcon';
import { getCategoryMapQueryOptions } from '~/features/categories/facets/categoryMap';
import { costToString } from '~/shared/utils/costToString';
import { getOrThrow } from '~/shared/utils/getOrThrow';

interface Props {
  label?: string | number;
  payload?: readonly TooltipPayloadEntry[];
}

export function DynamicsChartTooltip({ label, payload }: Props) {
  const { data: categoryMap } = useQuery(getCategoryMapQueryOptions());

  if (!payload || payload.length === 0) {
    return null;
  }

  return (
    <Paper withBorder shadow="md" radius="sm" p="sm">
      <Stack gap={4}>
        {label && (
          <Text size="sm" fw={500}>
            {label}
          </Text>
        )}
        {payload
          .filter((item) => item.dataKey !== undefined)
          .map((item) => {
            const category = categoryMap
              ? getOrThrow(categoryMap, Number(item.dataKey), 'Category')
              : null;
            return (
              <Group
                key={String(item.dataKey)}
                gap="md"
                wrap="nowrap"
                justify="space-between"
              >
                <Group gap={4} wrap="nowrap">
                  <ColorSwatch
                    color={item.color ?? 'gray'}
                    size={12}
                    withShadow={false}
                  />
                  <NameWithOptionalIcon
                    name={category?.shortname ?? String(item.dataKey)}
                    icon={category?.icon}
                    iconSize="0.75em"
                  />
                </Group>
                <Text size="sm">{costToString(Number(item.value ?? 0))}</Text>
              </Group>
            );
          })}
      </Stack>
    </Paper>
  );
}
