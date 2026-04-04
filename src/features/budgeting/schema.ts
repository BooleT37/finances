import { z } from 'zod';

import { decimalCodec } from '~/shared/codecs';

export const forecastSchema = z.object({
  categoryId: z.number(),
  subcategoryId: z.number().nullable(),
  month: z.number(),
  year: z.number(),
  sum: decimalCodec,
  comment: z.string(),
});

export type ForecastWire = z.input<typeof forecastSchema>;
export type Forecast = z.output<typeof forecastSchema>;
