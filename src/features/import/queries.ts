import { createQueryKeys } from '@lukemorales/query-key-factory';
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import { getTransactionsQueryOptions } from '~/features/transactions/queries';
import { transactionWithComponentsSchema } from '~/features/transactions/schema';

import { importTransactions, suggestCategories } from './api';
import type { ImportedTransaction } from './importedTransaction';
import {
  type ImportTransactionsInput,
  suggestCategoriesSchema,
} from './schema';

const importKeys = createQueryKeys('import', {
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
    onSuccess: async (created) => {
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
    },
  });
}
