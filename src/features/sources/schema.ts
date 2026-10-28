import { z } from 'zod';

import { Bank } from '~/generated/prisma/enums';

export const sourceSchema = z.object({
  id: z.number(),
  name: z.string(),
  bank: z.nativeEnum(Bank).nullable(),
});

export type SourceWire = z.input<typeof sourceSchema>;
export type Source = z.output<typeof sourceSchema>;

export const createSourceSchema = z.object({
  name: z.string().min(1),
});

export type CreateSourceInput = z.infer<typeof createSourceSchema>;

export const updateSourceNameSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
});

export const updateSourceOrderSchema = z.object({
  sourceIds: z.array(z.number()),
});

export const updateSourceBankSchema = z.object({
  id: z.number(),
  bank: z.nativeEnum(Bank).nullable(),
});

export type UpdateSourceNameInput = z.infer<typeof updateSourceNameSchema>;
export type UpdateSourceOrderInput = z.infer<typeof updateSourceOrderSchema>;
export type UpdateSourceBankInput = z.infer<typeof updateSourceBankSchema>;
