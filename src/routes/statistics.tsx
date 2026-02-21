import { Text } from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/statistics')({
  component: StatisticsPage,
});

function StatisticsPage() {
  return <Text c="dimmed">Statistics — coming soon</Text>;
}
