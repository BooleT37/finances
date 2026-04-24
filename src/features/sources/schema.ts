import { z } from 'zod';

export const sourceSchema = z.object({
  id: z.number(),
  name: z.string(),
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

export type UpdateSourceNameInput = z.infer<typeof updateSourceNameSchema>;
export type UpdateSourceOrderInput = z.infer<typeof updateSourceOrderSchema>;
