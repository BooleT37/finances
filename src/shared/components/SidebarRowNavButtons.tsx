import { ActionIcon, Group, Tooltip } from '@mantine/core';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';

interface Props {
  prevId: number | null;
  nextId: number | null;
  onNavigate: (id: number) => void;
  previousLabel: string;
  nextLabel: string;
}

/** Up/down row navigation buttons for an editing sidebar's title bar. */
export function SidebarRowNavButtons({
  prevId,
  nextId,
  onNavigate,
  previousLabel,
  nextLabel,
}: Props) {
  return (
    <Group gap={4} wrap="nowrap">
      <Tooltip label={previousLabel}>
        <ActionIcon
          variant="subtle"
          color="gray"
          aria-label={previousLabel}
          disabled={prevId === null}
          onClick={() => prevId !== null && onNavigate(prevId)}
        >
          <IconChevronUp size={18} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label={nextLabel}>
        <ActionIcon
          variant="subtle"
          color="gray"
          aria-label={nextLabel}
          disabled={nextId === null}
          onClick={() => nextId !== null && onNavigate(nextId)}
        >
          <IconChevronDown size={18} />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}
