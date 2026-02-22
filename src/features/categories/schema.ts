import { z } from 'zod';

export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  shortname: z.string(),
  isIncome: z.boolean(),
  isContinuous: z.boolean(),
  icon: z.string().nullable(),
});

export type CategoryWire = z.input<typeof categorySchema>;
export type Category = z.output<typeof categorySchema>;

export const subcategorySchema = z.object({
  id: z.number(),
  name: z.string(),
});

export type SubcategoryWire = z.input<typeof subcategorySchema>;
export type Subcategory = z.output<typeof subcategorySchema>;
