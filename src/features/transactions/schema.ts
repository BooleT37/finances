import { z } from 'zod';

import {
  categorySchema,
  subcategorySchema,
} from '~/features/categories/schema';
import { sourceSchema } from '~/features/sources/schema';
import { datetimeCodec, decimalCodec } from '~/shared/codecs';

// ── TransactionComponent ──────────────────────────────────────────────────────

export const transactionComponentSchema = z.object({
  id: z.number(),
  name: z.string(),
  cost: decimalCodec, // wire: string  ↔  client: Decimal
  categoryId: z.number(),
  subcategoryId: z.number().nullable(),
});

export const transactionComponentWithRelationsSchema =
  transactionComponentSchema.extend({
    category: categorySchema,
    subcategory: subcategorySchema.nullable(),
  });

export type TransactionComponentWithRelationsWire = z.input<
  typeof transactionComponentWithRelationsSchema
>;
export type TransactionComponentWithRelations = z.output<
  typeof transactionComponentWithRelationsSchema
>;

// ── Transaction ───────────────────────────────────────────────────────────────

export const transactionSchema = z.object({
  id: z.number(),
  name: z.string(),
  cost: decimalCodec, // wire: string  ↔  client: Decimal
  date: datetimeCodec, // wire: ISO string  ↔  client: Date
  actualDate: datetimeCodec.nullable(),
  categoryId: z.number(),
  subcategoryId: z.number().nullable(),
  sourceId: z.number().nullable(),
  subscriptionId: z.number().nullable(),
});

export const transactionWithRelationsSchema = transactionSchema.extend({
  category: categorySchema,
  subcategory: subcategorySchema.nullable(),
  source: sourceSchema.nullable(),
  components: z.array(transactionComponentWithRelationsSchema),
});

export type TransactionWithRelationsWire = z.input<
  typeof transactionWithRelationsSchema
>;
export type TransactionWithRelations = z.output<
  typeof transactionWithRelationsSchema
>;
