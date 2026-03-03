import { Tooltip } from '@mantine/core';
import type { ReactNode } from 'react';

interface Props {
  cost: string;
  suffix: string;
  color: 'red' | 'orange' | 'green';
  barWidth: number;
  barOffset?: number;
  tooltip?: ReactNode;
}

export function TotalCostCellView({
  cost,
  suffix,
  color,
  barOffset = 0,
  barWidth,
  tooltip,
}: Props) {
  return (
    <div>
      <div>
        {cost}&nbsp;
        <Tooltip label={tooltip}>
          <span style={{ fontSize: 12, color }}>{suffix}</span>
        </Tooltip>
      </div>
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
            width: `${barWidth * 100}%`,
            marginLeft: `${barOffset * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
