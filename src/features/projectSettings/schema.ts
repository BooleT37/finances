import { z } from 'zod';

export const projectSettingsSchema = z.object({
  incomeCategoriesOrder: z.array(z.number()),
  expenseCategoriesOrder: z.array(z.number()),
  sourcesOrder: z.array(z.number()),
});

export type ProjectSettingsWire = z.input<typeof projectSettingsSchema>;
export type ProjectSettings = z.output<typeof projectSettingsSchema>;
