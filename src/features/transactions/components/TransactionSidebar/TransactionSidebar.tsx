import { ActionIcon, Box, Paper, ScrollArea, Title } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { useMolecule } from 'bunshi/react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useMemo } from 'react';

import { TransactionSidebarForm } from './TransactionSidebarForm/TransactionSidebarForm';
import { TransactionSidebarMolecule } from './transactionSidebarMolecule';

export function TransactionSidebar({ width }: { width: number }) {
  const sidebarStyle: React.CSSProperties = useMemo(
    () => ({
      position: 'fixed',
      right: 0,
      top: 'var(--app-shell-header-height)',
      bottom: 0,
      width: width,
      transition: 'transform 150ms ease',
    }),
    [width],
  );
  const { isOpenAtom, editingIdAtom, closeAtom } = useMolecule(
    TransactionSidebarMolecule,
  );
  const isOpen = useAtomValue(isOpenAtom);
  const editingId = useAtomValue(editingIdAtom);
  const close = useSetAtom(closeAtom);

  return (
    <Box
      style={{
        ...sidebarStyle,
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
      }}
    >
      <Paper
        p="md"
        h="100%"
        style={{
          boxShadow: '-4px 0 12px rgba(0,0,0,0.12)',
          borderRadius: 0,
          position: 'relative',
        }}
      >
        <ActionIcon
          variant="subtle"
          color="gray"
          size="lg"
          style={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
          onClick={close}
        >
          <IconX size={20} />
        </ActionIcon>
        <Title order={4} mb="sm" pr={40}>
          {editingId !== null ? 'Редактировать' : 'Добавить'}
        </Title>
        <ScrollArea h="100%">
          <TransactionSidebarForm key={editingId ?? 'new'} />
        </ScrollArea>
      </Paper>
    </Box>
  );
}
