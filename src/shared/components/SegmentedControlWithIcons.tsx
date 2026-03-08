import {
  Group,
  SegmentedControl,
  type SegmentedControlProps,
  Tooltip,
} from '@mantine/core';
import type { ReactNode } from 'react';

interface Item {
  label: string;
  value: string;
  icon: ReactNode;
  disabled?: boolean;
}

interface Props extends Omit<SegmentedControlProps, 'data'> {
  data: Item[];
}

const labelSlideStyle = (visible: boolean): React.CSSProperties => ({
  maxWidth: visible ? 120 : 0,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  opacity: visible ? 1 : 0,
  paddingLeft: visible ? 4 : 0,
  transition:
    'max-width 150ms ease, opacity 150ms ease, padding-left 150ms ease',
});

export function SegmentedControlWithIcons({ data, value, ...props }: Props) {
  return (
    <SegmentedControl
      value={value}
      style={{ display: 'flex' }}
      {...props}
      data={data.map((item) => ({
        value: item.value,
        disabled: item.disabled,
        label: (
          <Tooltip label={item.label} disabled={value === item.value}>
            <Group gap={0} wrap="nowrap" justify="center">
              {item.icon}
              <span style={labelSlideStyle(value === item.value)}>
                {item.label}
              </span>
            </Group>
          </Tooltip>
        ),
      }))}
    />
  );
}
