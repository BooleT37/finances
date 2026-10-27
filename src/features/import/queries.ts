import { createQueryKeys } from '@lukemorales/query-key-factory';
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import { getTransactionsQueryOptions } from '~/features/transactions/queries';
import { transactionWithComponentsSchema } from '~/features/transactions/schema';

import { importTransactions, suggestCategories } from './api';
import {
  completeBankAuth,
  disconnectBankConnection,
  fetchBankConnections,
  fetchBankImportAvailable,
  fetchBankTransactions,
  selectBankAccount,
  startBankAuth,
} from './bankConnectionApi';
import {
  bankConnectionSchema,
  type BankConnectionSourceInput,
  type CompleteBankAuthInput,
  type FetchBankTransactionsInput,
  type SelectBankAccountInput,
} from './bankConnectionSchema';
import {
  type ImportedTransaction,
  importedTransactionSchema,
} from './importedTransaction';
import {
  type ImportTransactionsInput,
  suggestCategoriesSchema,
} from './schema';

const importKeys = createQueryKeys('import', {
  bankImportAvailable: { queryKey: null },
  bankConnections: { queryKey: null },
  categorySuggestions: (
    sourceId: number,
    subscriptionIds: number[],
    importedTransactionHashes: string[],
  ) => ({
    queryKey: [sourceId, subscriptionIds, importedTransactionHashes],
  }),
});

export const getCategorySuggestionsQueryOptions = ({
  sourceId,
  subscriptionIds,
  importedTransactions,
}: {
  sourceId: number;
  subscriptionIds: number[];
  importedTransactions: ImportedTransaction[];
}) =>
  queryOptions({
    ...importKeys.categorySuggestions(
      sourceId,
      subscriptionIds,
      importedTransactions.map(
        (importedTransaction) => importedTransaction.hash,
      ),
    ),
    queryFn: () =>
      suggestCategories({
        data: suggestCategoriesSchema.encode({
          sourceId,
          subscriptionIds,
          importedTransactions,
        }),
      }),
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
  });

export function useImportTransactions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ImportTransactionsInput) => {
      const wires = await importTransactions({ data: input });
      return wires.map((w) => transactionWithComponentsSchema.decode(w));
    },
    onSuccess: async (created, input) => {
      const years = new Set(created.map((tx) => tx.date.year()));
      for (const year of years) {
        queryClient.setQueryData(
          getTransactionsQueryOptions(year).queryKey,
          (old) => {
            const additions = created.filter((tx) => tx.date.year() === year);
            return old ? [...old, ...additions] : additions;
          },
        );
      }
      if (input.fromBank) {
        await queryClient.invalidateQueries(getBankConnectionsQueryOptions());
      }
    },
  });
}

export const getBankImportAvailableQueryOptions = () =>
  queryOptions({
    ...importKeys.bankImportAvailable,
    queryFn: () => fetchBankImportAvailable(),
    staleTime: Infinity,
  });

export const getBankConnectionsQueryOptions = () =>
  queryOptions({
    ...importKeys.bankConnections,
    queryFn: async () => {
      const rows = await fetchBankConnections();
      return rows.map((row) => bankConnectionSchema.decode(row));
    },
  });

export function useStartBankAuth() {
  return useMutation({
    mutationFn: (input: BankConnectionSourceInput) =>
      startBankAuth({ data: input }),
  });
}

export function useCompleteBankAuth() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CompleteBankAuthInput) =>
      completeBankAuth({ data: input }),
    onSuccess: () =>
      queryClient.invalidateQueries(getBankConnectionsQueryOptions()),
  });
}

export function useSelectBankAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SelectBankAccountInput) =>
      selectBankAccount({ data: input }),
    onSuccess: () =>
      queryClient.invalidateQueries(getBankConnectionsQueryOptions()),
  });
}

export function useDisconnectBankConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BankConnectionSourceInput) =>
      disconnectBankConnection({ data: input }),
    onSuccess: () =>
      queryClient.invalidateQueries(getBankConnectionsQueryOptions()),
  });
}

export function useFetchBankTransactions() {
  return useMutation({
    mutationFn: async (input: FetchBankTransactionsInput) => {
      const result = await fetchBankTransactions({ data: input });
      return result.status === 'fetched'
        ? {
            status: result.status,
            transactions: result.transactions.map((row) =>
              importedTransactionSchema.decode(row),
            ),
          }
        : result;
    },
  });
}
