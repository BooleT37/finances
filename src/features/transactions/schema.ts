import { z } from 'zod';

import { datetimeCodec, decimalCodec } from '~/shared/codecs';

// ── TransactionComponent ──────────────────────────────────────────────────────

export const transactionComponentSchema = z.object({
  id: z.number(),
  name: z.string(),
  cost: decimalCodec,
  categoryId: z.number(),
  subcategoryId: z.number().nullable(),
});
export type TransactionComponentWire = z.input<
  typeof transactionComponentSchema
>;
export type TransactionComponent = z.output<typeof transactionComponentSchema>;

// ── Transaction ───────────────────────────────────────────────────────────────

export const transactionSchema = z.object({
  id: z.number(),
  name: z.string(),
  cost: decimalCodec,
  date: datetimeCodec,
  actualDate: datetimeCodec.nullable(),
  categoryId: z.number(),
  subcategoryId: z.number().nullable(),
  sourceId: z.number().nullable(),
  subscriptionId: z.number().nullable(),
  savingSpendingCategoryId: z.number().nullable(),
});

export const transactionWithComponentsSchema = transactionSchema.extend({
  components: z.array(transactionComponentSchema),
});

export type TransactionWire = z.input<typeof transactionWithComponentsSchema>;
export type Transaction = z.output<typeof transactionWithComponentsSchema>;

// ── NewTransaction (create input) ─────────────────────────────────────────────

export const newTransactionComponentSchema = z.object({
  name: z.string(),
  cost: z.string(),
  categoryId: z.number(),
  subcategoryId: z.number().nullable().optional(),
});

export const updateTransactionComponentSchema =
  newTransactionComponentSchema.extend({
    id: z.number().optional(),
  });

export const newTransactionSchema = z.object({
  name: z.string(),
  cost: z.string(),
  date: z.string(),
  actualDate: z.string().nullable().optional(),
  categoryId: z.number(),
  subcategoryId: z.number().nullable().optional(),
  sourceId: z.number().nullable().optional(),
  subscriptionId: z.number().nullable().optional(),
  savingSpendingCategoryId: z.number().nullable().optional(),
  components: z.array(newTransactionComponentSchema).optional(),
});

export type NewTransactionInput = z.infer<typeof newTransactionSchema>;

// ── UpdateTransaction (update input) ──────────────────────────────────────────

export const updateTransactionSchema = newTransactionSchema.extend({
  id: z.number(),
  components: z.array(updateTransactionComponentSchema).optional(),
});

export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
