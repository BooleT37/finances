import { Group, Tooltip } from '@mantine/core';
import type { ReactNode } from 'react';

interface Props {
  cost: string;
  suffix: string;
  color: 'red' | 'orange' | 'green';
  barLength: number;
  barOffset: number;
  tooltip?: ReactNode;
}

export function CostWithDiffCellView({
  cost,
  suffix,
  color,
  barOffset,
  barLength,
  tooltip,
}: Props) {
  return (
    <div>
      <Group wrap="nowrap" gap={4}>
        <div style={{ whiteSpace: 'nowrap' }}>{cost}</div>
        <Tooltip label={tooltip}>
          <span style={{ fontSize: 12, color, whiteSpace: 'nowrap' }}>
            {suffix}
          </span>
        </Tooltip>
      </Group>
      <div
        style={{
          position: 'relative',
          border: '1px solid gray',
          height: 4,
          width: 60,
        }}
      >
        <div
          style={{
            height: 2,
            backgroundColor: color,
            width: `${barLength * 100}%`,
            marginLeft: `${barOffset * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
