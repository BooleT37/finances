import { z } from 'zod';

export const sourceSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export type SourceWire = z.input<typeof sourceSchema>;
export type Source = z.output<typeof sourceSchema>;
