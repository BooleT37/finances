import { z } from 'zod';

import { decimalCodec } from '~/shared/codecs';

export const forecastLineItemSchema = z.object({
  id: z.number(),
  unitPrice: z.string(),
  quantity: decimalCodec,
  comment: z.string(),
});

export type ForecastLineItemWire = z.input<typeof forecastLineItemSchema>;
export type ForecastLineItem = z.output<typeof forecastLineItemSchema>;

export const forecastSchema = z.object({
  id: z.number(),
  categoryId: z.number(),
  subcategoryId: z.number().nullable(),
  level: z.enum(['CATEGORY', 'SUBCATEGORY']),
  month: z.number(),
  year: z.number(),
  sum: decimalCodec,
  comment: z.string(),
  lineItems: z.array(forecastLineItemSchema),
});

export type ForecastWire = z.input<typeof forecastSchema>;
export type Forecast = z.output<typeof forecastSchema>;
