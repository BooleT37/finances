import { createQueryKeys } from '@lukemorales/query-key-factory';
import {
  mutationOptions,
  type QueryClient,
  queryOptions,
} from '@tanstack/react-query';

import {
  createTransaction,
  fetchTransactionsByYear,
  updateTransaction,
} from '~/features/transactions/api';

import {
  type NewTransactionInput,
  transactionWithComponentsSchema,
  type UpdateTransactionInput,
} from './schema';

const transactionsKeys = createQueryKeys('transactions', {
  byYear: (year: number) => ({
    queryKey: [year],
  }),
});

export const getTransactionsQueryOptions = (year: number) => {
  return queryOptions({
    ...transactionsKeys.byYear(year),
    queryFn: async () => {
      const rows = await fetchTransactionsByYear({ data: year });
      return rows.map((t) => transactionWithComponentsSchema.decode(t));
    },
  });
};

export const getUpdateTransactionMutationOptions = (
  queryClient: QueryClient,
  year: number,
) =>
  mutationOptions({
    mutationFn: async (input: UpdateTransactionInput) => {
      const wire = await updateTransaction({ data: input });
      return transactionWithComponentsSchema.decode(wire);
    },
    onSuccess: (updatedTx) => {
      queryClient.setQueryData(
        getTransactionsQueryOptions(year).queryKey,
        (old) => old?.map((tx) => (tx.id === updatedTx.id ? updatedTx : tx)),
      );
    },
  });

export const getAddTransactionMutationOptions = (
  queryClient: QueryClient,
  year: number,
) =>
  mutationOptions({
    mutationFn: async (input: NewTransactionInput) => {
      const wire = await createTransaction({ data: input });
      return transactionWithComponentsSchema.decode(wire);
    },
    onSuccess: (newTx) => {
      queryClient.setQueryData(
        getTransactionsQueryOptions(year).queryKey,
        (old) => (old ? [...old, newTx] : [newTx]),
      );
    },
  });
