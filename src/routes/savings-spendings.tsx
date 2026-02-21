import { Text } from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/savings-spendings')({
  component: SavingsSpendingsPage,
});

function SavingsSpendingsPage() {
  return <Text c="dimmed">Savings Spendings — coming soon</Text>;
}
