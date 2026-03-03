import { ActionIcon, Group } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';

interface Props {
  id: number;
  parentExpenseId: number | null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function RowActions(_props: Props) {
  return (
    <Group gap={4}>
      <ActionIcon variant="subtle" disabled>
        <IconEdit size={16} />
      </ActionIcon>
      <ActionIcon variant="subtle" color="red" disabled>
        <IconTrash size={16} />
      </ActionIcon>
    </Group>
  );
}
