import { createServerFn } from '@tanstack/react-start';
import dayjs from 'dayjs';

import { prisma } from '~/server/db';
import { adaptCost } from '~/shared/utils/adaptCost';

import { subscriptionSchema } from './schema';

export const fetchAllSubscriptions = createServerFn({ method: 'GET' }).handler(
  async () => {
    const subscriptions = await prisma.subscription.findMany({
      orderBy: { name: 'asc' },
      include: { category: true },
    });
    return subscriptions.map((s) =>
      subscriptionSchema.encode({
        ...s,
        cost: adaptCost(s.cost, s.category.isIncome),
        firstDate: dayjs(s.firstDate),
      }),
    );
  },
);
