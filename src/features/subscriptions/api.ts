import { createServerFn } from '@tanstack/react-start';
import dayjs from 'dayjs';

import { prisma } from '~/server/db';

import { subscriptionSchema } from './schema';

export const fetchAllSubscriptions = createServerFn({ method: 'GET' }).handler(
  async () => {
    const subscriptions = await prisma.subscription.findMany({
      orderBy: { name: 'asc' },
    });
    return subscriptions.map((s) =>
      subscriptionSchema.encode({ ...s, firstDate: dayjs(s.firstDate) }),
    );
  },
);
