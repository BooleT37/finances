import { createServerFn } from '@tanstack/react-start';

import { prisma } from '~/server/db';

export const fetchExpensesByYear = createServerFn({ method: 'GET' })
  .inputValidator((year: number) => year)
  .handler(async ({ data: year }) => {
    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
      orderBy: { date: 'asc' },
    });
    return expenses.map((e) => ({ ...e, cost: e.cost.toString() }));
  });
