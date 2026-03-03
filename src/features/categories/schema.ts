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
