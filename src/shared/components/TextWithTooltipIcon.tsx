import { Group, Tooltip } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import type { ReactNode } from 'react';

interface TextWithTooltipIconProps {
  children: ReactNode;
  tooltip: ReactNode;
}

export function TextWithTooltipIcon({
  children,
  tooltip,
}: TextWithTooltipIconProps) {
  return (
    <Group gap={4} align="center">
      {children}
      <Tooltip label={tooltip} multiline w={220}>
        <IconInfoCircle size={14} />
      </Tooltip>
    </Group>
  );
}
