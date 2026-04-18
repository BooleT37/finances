import { z } from 'zod';

export const subcategorySchema = z.object({
  id: z.number(),
  name: z.string(),
});

export type SubcategoryWire = z.input<typeof subcategorySchema>;
export type Subcategory = z.output<typeof subcategorySchema>;

export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  shortname: z.string(),
  type: z.enum(['FROM_SAVINGS', 'TO_SAVINGS']).nullable(),
  isIncome: z.boolean(),
  isContinuous: z.boolean(),
  icon: z.string().nullable(),
  subcategories: z.array(subcategorySchema),
});

export type CategoryWire = z.input<typeof categorySchema>;
export type Category = z.output<typeof categorySchema>;

// ── Mutation input schemas ────────────────────────────────────────────────────

export const createCategorySchema = z.object({
  name: z.string().min(1),
  shortname: z.string().min(1).max(16),
  icon: z.string().nullable(),
  isIncome: z.boolean(),
  isContinuous: z.boolean(),
  subcategories: z.array(z.object({ name: z.string().min(1) })),
});

export type CreateCategoryInput = z.output<typeof createCategorySchema>;

export const updateCategorySchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  shortname: z.string().min(1).max(16),
  icon: z.string().nullable(),
  isContinuous: z.boolean(),
  subcategories: z.array(
    z.object({ id: z.number().optional(), name: z.string().min(1) }),
  ),
});

export type UpdateCategoryInput = z.output<typeof updateCategorySchema>;

export const updateCategoryOrderSchema = z.object({
  isIncome: z.boolean(),
  categoryIds: z.array(z.number()),
});

export type UpdateCategoryOrderInput = z.output<
  typeof updateCategoryOrderSchema
>;
