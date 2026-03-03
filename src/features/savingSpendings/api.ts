import { createServerFn } from '@tanstack/react-start';

import { prisma } from '~/server/db';

import { savingSpendingSchema } from './schema';

export const fetchAllSavingSpendings = createServerFn({
  method: 'GET',
}).handler(async () => {
  const savingSpendings = await prisma.savingSpending.findMany({
    include: { categories: true },
  });
  return savingSpendings.map((s) => savingSpendingSchema.encode(s));
});
