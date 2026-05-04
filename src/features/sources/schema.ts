import { z } from 'zod';

import { ExpensesParser } from '~/generated/prisma/enums';

export const sourceSchema = z.object({
  id: z.number(),
  name: z.string(),
  parser: z.nativeEnum(ExpensesParser).nullable(),
});

export type SourceWire = z.input<typeof sourceSchema>;
export type Source = z.output<typeof sourceSchema>;

export const updateSourceNameSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
});

export const updateSourceOrderSchema = z.object({
  sourceIds: z.array(z.number()),
});

export const updateSourceParserSchema = z.object({
  id: z.number(),
  parser: z.nativeEnum(ExpensesParser).nullable(),
});

export type UpdateSourceNameInput = z.infer<typeof updateSourceNameSchema>;
export type UpdateSourceOrderInput = z.infer<typeof updateSourceOrderSchema>;
export type UpdateSourceParserInput = z.infer<typeof updateSourceParserSchema>;
