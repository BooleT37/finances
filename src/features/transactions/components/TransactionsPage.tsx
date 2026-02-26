import { Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';

import { getTransactionsQueryOptions } from '~/features/transactions/queries';
import { selectedYearAtom } from '~/stores/month';

export function TransactionsPage() {
  const year = useAtomValue(selectedYearAtom);
  const { data, isLoading, error } = useQuery(
    getTransactionsQueryOptions(year),
  );

  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text c="red">{String(error)}</Text>;
  return <pre style={{ fontSize: 12 }}>{JSON.stringify(data, null, 2)}</pre>;
}
