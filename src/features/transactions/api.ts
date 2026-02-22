import { createServerFn } from '@tanstack/react-start';

import { prisma } from '~/server/db';

import { transactionWithRelationsSchema } from './schema';

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
      include: {
        category: true,
        subcategory: true,
        source: true,
        components: { include: { category: true, subcategory: true } },
      },
    });

    return transactions.map((t) => transactionWithRelationsSchema.encode(t));
  });
