import { Text } from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/budgeting')({
  component: BudgetingPage,
});

function BudgetingPage() {
  return <Text c="dimmed">Budgeting — coming soon</Text>;
}
