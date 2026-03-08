import { ActionIcon, Group } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { useMolecule } from 'bunshi/react';
import { useSetAtom } from 'jotai';

import { TransactionSidebarMolecule } from '../TransactionSidebar/transactionSidebarMolecule';

interface Props {
  id: number;
  parentExpenseId: number | null;
  name: string;
}

export function RowActions({ id }: Props) {
  const { openAtom } = useMolecule(TransactionSidebarMolecule);
  const open = useSetAtom(openAtom);

  return (
    <Group gap={4}>
      <ActionIcon variant="subtle" onClick={() => open(id)}>
        <IconEdit size={16} />
      </ActionIcon>
      <ActionIcon variant="subtle" color="red" disabled>
        <IconTrash size={16} />
      </ActionIcon>
    </Group>
  );
}
