import { ColorSwatch, Group } from '@mantine/core';
import type { LegendPayload } from 'recharts';

import { NameWithOptionalIcon } from '~/features/categories/components/NameWithOptionalIcon';
import type { Category } from '~/features/categories/schema';
import { getOrThrow } from '~/shared/utils/getOrThrow';

interface Props {
  payload?: readonly LegendPayload[];
  categoryMap: Record<string, Category> | undefined;
}

export function DynamicsChartLegend({ payload, categoryMap }: Props) {
  if (!payload) {
    return null;
  }

  return (
    <Group justify="center" gap="xs" pb="md">
      {payload
        .filter((item) => item.dataKey !== undefined)
        .map((item) => {
          const category = categoryMap
            ? getOrThrow(categoryMap, Number(item.dataKey), 'Category')
            : null;
          return (
            <Group key={String(item.dataKey)} gap={4} wrap="nowrap">
              <ColorSwatch
                color={item.color ?? 'gray'}
                size={12}
                withShadow={false}
              />
              <NameWithOptionalIcon
                name={category?.shortname ?? String(item.dataKey)}
                icon={category?.icon}
              />
            </Group>
          );
        })}
    </Group>
  );
}
