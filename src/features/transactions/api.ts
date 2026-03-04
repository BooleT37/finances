import { createServerFn } from '@tanstack/react-start';
import dayjs from 'dayjs';

import { prisma } from '~/server/db';
import { adaptCost } from '~/shared/utils/adaptCost';

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
        category: true,
        components: { include: { category: true } },
      },
    });

    return transactions.map((tx) =>
      transactionWithComponentsSchema.encode({
        ...tx,
        cost: adaptCost(tx.cost, tx.category.isIncome),
        date: dayjs(tx.date),
        actualDate: tx.actualDate ? dayjs(tx.actualDate) : null,
        components: tx.components.map((c) => ({
          ...c,
          cost: adaptCost(c.cost, c.category.isIncome),
        })),
      }),
    );
  });
