import { Box, Button, Group, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import {
  getSavingSpendingsQueryOptions,
  useDeleteSavingSpending,
  useUnarchiveSavingSpending,
} from '../../queries';
import { SavingSpendingCard } from './SavingSpendingCard';

export function SavingSpendingsArchivePage() {
  const { t } = useTranslation('savingSpendings');
  const { data: allItems = [] } = useQuery(getSavingSpendingsQueryOptions());
  const deleteMutation = useDeleteSavingSpending();
  const unarchiveMutation = useUnarchiveSavingSpending();

  const items = allItems.filter((s) => s.completed);

  function handleUnarchive(id: number) {
    unarchiveMutation.mutate(id, {
      onSuccess: () =>
        notifications.show({
          message: t('notifications.unarchived'),
          color: 'green',
        }),
    });
  }

  function handleDelete(id: number) {
    deleteMutation.mutate(id, {
      onSuccess: () =>
        notifications.show({
          message: t('notifications.deleted'),
          color: 'green',
        }),
    });
  }

  return (
    <Stack gap="md">
      <Group gap="sm">
        <Button
          variant="default"
          leftSection={<IconArrowLeft size={16} />}
          component={Link}
          to="/savings-spendings"
        >
          {t('backToSavingSpendings')}
        </Button>
      </Group>

      <Box
        style={{
          columns: '320px',
          columnGap: 'var(--mantine-spacing-md)',
        }}
      >
        {items.map((item) => (
          <Box
            key={item.id}
            style={{
              breakInside: 'avoid',
              marginBottom: 'var(--mantine-spacing-md)',
            }}
          >
            <SavingSpendingCard
              item={item}
              onUnarchive={handleUnarchive}
              onDelete={handleDelete}
            />
          </Box>
        ))}
      </Box>
    </Stack>
  );
}
