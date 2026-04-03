import { createServerFn } from '@tanstack/react-start';

import { prisma } from '~/server/db';
import { adaptCost } from '~/shared/utils/adaptCost';

import { forecastSchema } from './schema';

export const fetchForecastsByYear = createServerFn({ method: 'GET' })
  .inputValidator((year: number) => year)
  .handler(async ({ data: year }) => {
    const forecasts = await prisma.forecast.findMany({
      where: { year },
      include: { category: true },
    });
    return forecasts.map((f) =>
      forecastSchema.encode({
        ...f,
        sum: adaptCost(f.sum, f.category.isIncome),
      }),
    );
  });
