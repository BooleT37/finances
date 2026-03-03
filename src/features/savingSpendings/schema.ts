import { z } from 'zod';

import { decimalCodec } from '~/shared/codecs';

export const savingSpendingCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  forecast: decimalCodec,
  comment: z.string(),
});

export type SavingSpendingCategoryWire = z.input<
  typeof savingSpendingCategorySchema
>;
export type SavingSpendingCategory = z.output<
  typeof savingSpendingCategorySchema
>;

export const savingSpendingSchema = z.object({
  id: z.number(),
  name: z.string(),
  completed: z.boolean(),
  categories: z.array(savingSpendingCategorySchema),
});

export type SavingSpendingWire = z.input<typeof savingSpendingSchema>;
export type SavingSpending = z.output<typeof savingSpendingSchema>;
