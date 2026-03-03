import { createServerFn } from '@tanstack/react-start';
import dayjs from 'dayjs';

import { prisma } from '~/server/db';

import { transactionWithComponentsSchema } from './schema';

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
        components: true,
      },
    });

    return transactions.map((t) =>
      transactionWithComponentsSchema.encode({
        ...t,
        date: dayjs(t.date),
        actualDate: t.actualDate ? dayjs(t.actualDate) : null,
      }),
    );
  });
