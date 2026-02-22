import { z } from 'zod';

export const userSettingSchema = z.object({
  incomeCategoriesOrder: z.array(z.number()),
  expenseCategoriesOrder: z.array(z.number()),
  sourcesOrder: z.array(z.number()),
});

export type UserSettingWire = z.input<typeof userSettingSchema>;
export type UserSetting = z.output<typeof userSettingSchema>;
