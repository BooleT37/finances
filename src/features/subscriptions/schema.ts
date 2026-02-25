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
