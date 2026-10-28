import { z } from 'zod';

import { importedTransactionSchema } from './importedTransaction';

export const importTransactionItemSchema = z.object({
  name: z.string(),
  cost: z.string(),
  date: z.string(),
  categoryId: z.number(),
  subcategoryId: z.number().nullable().optional(),
  subscriptionId: z.number().nullable().optional(),
  importHash: z.string(),
  importedDescription: z.string(),
  categorySuggestionTrace: z
    .object({ traceId: z.string(), suggestedValue: z.string().nullable() })
    .nullable()
    .optional(),
});

export const importTransactionsSchema = z.object({
  sourceId: z.number(),
  fromBank: z.boolean(),
  transactions: z.array(importTransactionItemSchema),
});
export type ImportTransactionItem = z.infer<typeof importTransactionItemSchema>;
export type ImportTransactionsInput = z.infer<typeof importTransactionsSchema>;

export const suggestCategoriesSchema = z.object({
  sourceId: z.number(),
  subscriptionIds: z.array(z.number()),
  importedTransactions: z.array(importedTransactionSchema),
});
export type SuggestCategoriesInput = z.input<typeof suggestCategoriesSchema>;

export const parsePdfExpensesSchema = z.object({
  sourceId: z.number(),
  fileBase64: z.string(),
});
export type ParsePdfExpensesInput = z.infer<typeof parsePdfExpensesSchema>;
