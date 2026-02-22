import { createServerFn } from '@tanstack/react-start';

import { prisma } from '~/server/db';

import { forecastSchema } from './schema';

export const fetchForecastsByYear = createServerFn({ method: 'GET' })
  .inputValidator((year: number) => year)
  .handler(async ({ data: year }) => {
    const forecasts = await prisma.forecast.findMany({ where: { year } });
    return forecasts.map((f) => forecastSchema.encode(f));
  });
