import { Text } from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/planning')({
  component: PlanningPage,
});

function PlanningPage() {
  return <Text c="dimmed">Planning — coming soon</Text>;
}
