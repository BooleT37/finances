import { createServerFn } from '@tanstack/react-start';

import { prisma } from '~/server/db';

export const fetchTransactionsByYear = createServerFn({ method: 'GET' })
  .inputValidator((year: number) => year)
  .handler(async ({ data: year }) => {
    const transactions = await prisma.expense.findMany({
      where: {
        date: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
      orderBy: { date: 'asc' },
    });
    return transactions.map((t) => ({ ...t, cost: t.cost.toString() }));
  });
