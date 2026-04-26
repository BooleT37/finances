import { z } from 'zod';

import { datetimeCodec, decimalCodec } from '~/shared/codecs';

export const subscriptionSchema = z.object({
  id: z.number(),
  name: z.string(),
  cost: decimalCodec,
  period: z.number(),
  firstDate: datetimeCodec,
  active: z.boolean(),
  categoryId: z.number(),
  subcategoryId: z.number().nullable(),
  sourceId: z.number().nullable(),
});

export type SubscriptionWire = z.input<typeof subscriptionSchema>;
export type Subscription = z.output<typeof subscriptionSchema>;

// ── Mutation input schemas ────────────────────────────────────────────────────

export const createSubscriptionSchema = z.object({
  name: z.string().min(1),
  cost: z.string(),
  period: z.number().int().positive(),
  firstDate: z.string(),
  categoryId: z.number().int().positive(),
  subcategoryId: z.number().int().nullable(),
  sourceId: z.number().int().nullable(),
  active: z.boolean().default(true),
});

export type CreateSubscriptionInput = z.output<typeof createSubscriptionSchema>;

export const updateSubscriptionSchema = createSubscriptionSchema.extend({
  id: z.number().int().positive(),
  active: z.boolean(),
});

export type UpdateSubscriptionInput = z.output<typeof updateSubscriptionSchema>;
