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
