import { z } from 'zod';

import { decimalCodec } from '~/shared/codecs';

export const savingSpendingCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  forecast: decimalCodec,
  comment: z.string(),
  savingSpendingId: z.number().nullable(),
  actual: decimalCodec,
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

// Input schemas for mutations (used by forms and API validators)

export const savingSpendingCategoryInputSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  forecast: z.string(),
  comment: z.string(),
});

export const createSavingSpendingSchema = z.object({
  name: z.string(),
  categories: z.array(savingSpendingCategoryInputSchema),
});

export const updateSavingSpendingSchema = createSavingSpendingSchema.extend({
  id: z.number(),
});

export type SavingSpendingCategoryInput = z.infer<
  typeof savingSpendingCategoryInputSchema
>;
export type CreateSavingSpendingInput = z.infer<
  typeof createSavingSpendingSchema
>;
export type UpdateSavingSpendingInput = z.infer<
  typeof updateSavingSpendingSchema
>;
