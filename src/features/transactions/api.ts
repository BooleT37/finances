import { createServerFn } from '@tanstack/react-start';
import dayjs from 'dayjs';
import Decimal from 'decimal.js';

import { prisma } from '~/server/db';
import { adaptCost } from '~/shared/utils/adaptCost';

import {
  type NewTransactionInput,
  newTransactionSchema,
  transactionWithComponentsSchema,
  type UpdateTransactionInput,
  updateTransactionSchema,
} from './schema';

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

// TODO: replace userId with actual user from auth once auth is implemented
export const createTransaction = createServerFn({ method: 'POST' })
  .inputValidator((input: NewTransactionInput) =>
    newTransactionSchema.parse(input),
  )
  .handler(async ({ data }) => {
    // TODO: replace with actual user from auth
    const user = await prisma.user.findFirstOrThrow();

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
        userId: user.id,
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
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }) => {
    await prisma.expense.delete({ where: { id } });
  });

export const updateTransaction = createServerFn({ method: 'POST' })
  .inputValidator((input: UpdateTransactionInput) =>
    updateTransactionSchema.parse(input),
  )
  .handler(async ({ data }) => {
    const { id, components, ...fields } = data;

    const tx = await prisma.expense.update({
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
            deleteMany: {
              id: {
                notIn: components
                  .filter((c) => c.id !== undefined)
                  .map((c) => c.id!),
              },
            },
          },
        }),
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
