import { SegmentedControl, type SegmentedControlProps } from '@mantine/core';

import type { SegmentedControlWithIconsItem } from './SegmentedControlWithIcons.types';
import { SegmentedControlWithIconsLabel } from './SegmentedControlWithIconsLabel';

interface Props extends Omit<SegmentedControlProps, 'data'> {
  data: SegmentedControlWithIconsItem[];
}

export function SegmentedControlWithIcons({ data, value, ...props }: Props) {
  return (
    <SegmentedControl
      value={value}
      style={{ display: 'flex' }}
      {...props}
      data={data.map((item) => ({
        value: item.value,
        disabled: item.disabled,
        label: <SegmentedControlWithIconsLabel item={item} value={value} />,
      }))}
    />
  );
}
