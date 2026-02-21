import { Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useAtom } from 'jotai';

import { transactionsKeys } from '~/features/transactions/queries';
import { selectedMonthAtom } from '~/stores/month';

export const Route = createFileRoute('/transactions')({
  component: TransactionsPage,
});

function TransactionsPage() {
  const [selectedMonth] = useAtom(selectedMonthAtom);
  const year = parseInt(selectedMonth.slice(0, 4), 10);
  const { data, isLoading, error } = useQuery(transactionsKeys.byYear(year));

  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text c="red">{String(error)}</Text>;
  return <pre style={{ fontSize: 12 }}>{JSON.stringify(data, null, 2)}</pre>;
}
