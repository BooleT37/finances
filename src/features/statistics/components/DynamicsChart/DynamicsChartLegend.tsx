import { Anchor, Box, ColorSwatch, Group, Text } from '@mantine/core';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const VISIBLE_LIMIT = 5;
const EXPANDED_MAX_HEIGHT = 96;

export interface DynamicsChartLegendItem {
  name: string;
  label: string;
  color: string;
}

interface DynamicsChartLegendProps {
  series: DynamicsChartLegendItem[];
}

export function DynamicsChartLegend({ series }: DynamicsChartLegendProps) {
  const { t } = useTranslation('statistics');
  const [expanded, setExpanded] = useState(false);

  if (series.length === 0) {
    return null;
  }

  const visibleSeries = expanded ? series : series.slice(0, VISIBLE_LIMIT);
  const hiddenCount = series.length - VISIBLE_LIMIT;

  return (
    <Box px="lg" pb="xs">
      <Group
        gap="md"
        justify="center"
        wrap="wrap"
        style={
          expanded
            ? { maxHeight: EXPANDED_MAX_HEIGHT, overflowY: 'auto' }
            : undefined
        }
      >
        {visibleSeries.map((item) => (
          <Group key={item.name} gap={4} wrap="nowrap">
            <ColorSwatch color={item.color} size={12} withShadow={false} />
            <Text size="sm">{item.label}</Text>
          </Group>
        ))}
      </Group>
      {hiddenCount > 0 && (
        <Group justify="center" mt={4}>
          <Anchor
            component="button"
            type="button"
            size="sm"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded
              ? t('dynamics.legend.showLess')
              : t('dynamics.legend.showMore', { count: hiddenCount })}
          </Anchor>
        </Group>
      )}
    </Box>
  );
}
