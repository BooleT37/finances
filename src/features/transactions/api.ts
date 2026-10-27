import { createServerFn } from '@tanstack/react-start';
import dayjs from 'dayjs';
import Decimal from 'decimal.js';

import { authMiddleware } from '~/middlewares/authMiddleware';
import { trackInput } from '~/middlewares/tracking/trackInput';
import { prisma } from '~/server/db';
import { adaptCost } from '~/shared/utils/adaptCost';
import { assertOwnedByProject } from '~/shared/utils/assertOwnedByProject';

import {
  type NewTransactionInput,
  newTransactionSchema,
  transactionWithComponentsSchema,
  type UpdateTransactionInput,
  updateTransactionSchema,
} from './schema';

export const fetchTransactionsByYear = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((year: number) => year)
  .handler(async ({ data: year, context }) => {
    const transactions = await prisma.expense.findMany({
      where: {
        projectId: context.projectId,
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

export const createTransaction = createServerFn({ method: 'POST' })
  .middleware([
    authMiddleware,
    trackInput<NewTransactionInput>({
      name: 'omit',
      cost: 'send',
      date: 'send',
      actualDate: 'send',
      components: { name: 'omit', cost: 'send' },
    }),
  ])
  .validator((input: NewTransactionInput) => newTransactionSchema.parse(input))
  .handler(async ({ data, context }) => {
    const tx = await prisma.expense.create({
      data: {
        name: data.name,
        cost: new Decimal(data.cost).abs(),
        date: new Date(data.date),
        actualDate: data.actualDate ? new Date(data.actualDate) : null,
        categoryId: data.categoryId,
        subcategoryId: data.subcategoryId ?? null,
        sourceId: data.sourceId ?? null,
        subscriptionId: data.subscriptionId ?? null,
        savingSpendingCategoryId: data.savingSpendingCategoryId ?? null,
        projectId: context.projectId,
        components: data.components?.length
          ? {
              createMany: {
                data: data.components.map((c) => ({
                  name: c.name,
                  cost: new Decimal(c.cost).abs(),
                  categoryId: c.categoryId,
                  subcategoryId: c.subcategoryId ?? null,
                })),
              },
            }
          : undefined,
      },
      include: {
        category: true,
        components: { include: { category: true } },
      },
    });

    return transactionWithComponentsSchema.encode({
      ...tx,
      cost: adaptCost(tx.cost, tx.category.isIncome),
      date: dayjs(tx.date),
      actualDate: tx.actualDate ? dayjs(tx.actualDate) : null,
      components: tx.components.map((c) => ({
        ...c,
        cost: adaptCost(c.cost, c.category.isIncome),
      })),
    });
  });

export const deleteTransaction = createServerFn({ method: 'POST' })
  .middleware([authMiddleware, trackInput<number>()])
  .validator((id: number) => id)
  .handler(async ({ data: id, context }) => {
    await assertOwnedByProject(
      prisma.expense,
      id,
      context.projectId,
      'Transaction',
    );
    await prisma.expense.delete({ where: { id } });
  });

export const updateTransaction = createServerFn({ method: 'POST' })
  .middleware([
    authMiddleware,
    trackInput<UpdateTransactionInput>({
      name: 'omit',
      cost: 'send',
      date: 'send',
      actualDate: 'send',
      components: { name: 'omit', cost: 'send' },
    }),
  ])
  .validator((input: UpdateTransactionInput) =>
    updateTransactionSchema.parse(input),
  )
  .handler(async ({ data, context }) => {
    const { id, components, ...fields } = data;

    await assertOwnedByProject(
      prisma.expense,
      id,
      context.projectId,
      'Transaction',
    );

    const keptIds = components
      ?.filter((c) => c.id !== undefined)
      .map((c) => c.id!);

    // Build the update query once — used directly or inside a batch transaction.
    // Batch $transaction([...]) avoids holding a DB connection open (unlike the
    // interactive callback form), which prevents P2028 timeouts in serverless.
    const expenseUpdate = prisma.expense.update({
      where: { id },
      data: {
        name: fields.name,
        cost: new Decimal(fields.cost).abs(),
        date: new Date(fields.date),
        categoryId: fields.categoryId,
        actualDate:
          fields.actualDate !== undefined
            ? fields.actualDate
              ? new Date(fields.actualDate)
              : null
            : undefined,
        subcategoryId: fields.subcategoryId,
        sourceId: fields.sourceId,
        subscriptionId: fields.subscriptionId,
        savingSpendingCategoryId: fields.savingSpendingCategoryId,
        ...(components !== undefined && {
          components: {
            createMany: {
              data: components
                .filter((c) => c.id === undefined)
                .map((c) => ({
                  name: c.name,
                  cost: new Decimal(c.cost).abs(),
                  categoryId: c.categoryId,
                  subcategoryId: c.subcategoryId ?? null,
                })),
            },
            update: components
              .filter((c) => c.id !== undefined)
              .map((c) => ({
                where: { id: c.id },
                data: {
                  name: c.name,
                  cost: new Decimal(c.cost).abs(),
                  categoryId: c.categoryId,
                  subcategoryId: c.subcategoryId ?? null,
                },
              })),
          },
        }),
      },
      include: {
        category: true,
        components: { include: { category: true } },
      },
    });

    const tx =
      keptIds !== undefined
        ? (
            await prisma.$transaction([
              prisma.expenseComponent.deleteMany({
                where: { expenseId: id, id: { notIn: keptIds } },
              }),
              expenseUpdate,
            ])
          )[1]
        : await expenseUpdate;

    return transactionWithComponentsSchema.encode({
      ...tx,
      cost: adaptCost(tx.cost, tx.category.isIncome),
      date: dayjs(tx.date),
      actualDate: tx.actualDate ? dayjs(tx.actualDate) : null,
      components: tx.components.map((c) => ({
        ...c,
        cost: adaptCost(c.cost, c.category.isIncome),
      })),
    });
  });
