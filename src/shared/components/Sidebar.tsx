import { ActionIcon, Box, Loader, Paper, Title } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { Suspense, useMemo } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  width: number;
  children: React.ReactNode;
}

export function Sidebar({ isOpen, onClose, title, width, children }: Props) {
  const style = useMemo<React.CSSProperties>(
    () => ({
      position: 'fixed',
      right: 0,
      top: 'var(--app-shell-header-height)',
      bottom: 0,
      width,
      zIndex: 200,
      transition: 'transform 150ms ease',
    }),
    [width],
  );

  return (
    <Box
      style={{
        ...style,
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
          overflow: 'scroll',
        }}
      >
        <ActionIcon
          variant="subtle"
          color="gray"
          size="lg"
          aria-label="Закрыть"
          style={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
          onClick={onClose}
        >
          <IconX size={20} />
        </ActionIcon>
        <Title order={4} mb="sm" pr={40}>
          {title}
        </Title>
        <Suspense fallback={<Loader size="sm" />}>{children}</Suspense>
      </Paper>
    </Box>
  );
}
