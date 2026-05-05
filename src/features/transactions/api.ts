import { createServerFn } from '@tanstack/react-start';
import dayjs from 'dayjs';
import Decimal from 'decimal.js';

import { prisma } from '~/server/db';
import { adaptCost } from '~/shared/utils/adaptCost';

import {
  type ImportTransactionsInput,
  importTransactionsSchema,
  type NewTransactionInput,
  newTransactionSchema,
  type ParsePdfExpensesInput,
  parsePdfExpensesSchema,
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

    const tx = await prisma.$transaction(async (db) => {
      if (components !== undefined) {
        const keptIds = components
          .filter((c) => c.id !== undefined)
          .map((c) => c.id!);

        await db.expenseComponent.deleteMany({
          where: { expenseId: id, id: { notIn: keptIds } },
        });
      }

      return db.expense.update({
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

export const parsePdfExpenses = createServerFn({ method: 'POST' })
  .inputValidator((input: ParsePdfExpensesInput) =>
    parsePdfExpensesSchema.parse(input),
  )
  .handler(async ({ data }) => {
    // pdfjs-dist needs DOMMatrix on globalThis (not available in Vercel's
    // Node.js runtime). Polyfill before importing pdfjs.
    if (typeof globalThis.DOMMatrix === 'undefined') {
      const { default: DOMMatrixPolyfill } = await import('@thednp/dommatrix');
      globalThis.DOMMatrix = DOMMatrixPolyfill as unknown as typeof DOMMatrix;
    }

    // Nitro flattens pdfjs-dist into _libs/ and doesn't ship pdf.worker.mjs
    // alongside, so pdfjs's relative dynamic import to "./pdf.worker.mjs"
    // fails. Bake the worker source via Vite's ?raw, write it to /tmp at
    // runtime, and point GlobalWorkerOptions.workerSrc at it. The cached
    // pdfjs module instance is reused later by pdf-data-parser.
    const workerModule =
      (await import('pdfjs-dist/legacy/build/pdf.worker.mjs?raw')) as {
        default: string;
      };
    const fs = await import('node:fs');
    const tmpWorkerPath = '/tmp/pdf.worker.mjs';
    if (!fs.existsSync(tmpWorkerPath)) {
      fs.writeFileSync(tmpWorkerPath, workerModule.default);
    }
    const pdfjs = (await import('pdfjs-dist/legacy/build/pdf.mjs')) as {
      GlobalWorkerOptions: { workerSrc: string };
    };
    pdfjs.GlobalWorkerOptions.workerSrc = tmpWorkerPath;

    const { randomUUID } = await import('node:crypto');
    const { unlinkSync, writeFileSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const { VividPdfExpensesParser } =
      await import('~/server/ExpensesParser/VividPdfExpensesParser');

    const buffer = Buffer.from(data.fileBase64, 'base64');
    const tmpPath = join(tmpdir(), `${randomUUID()}.pdf`);
    try {
      writeFileSync(tmpPath, buffer);
      const parser = new VividPdfExpensesParser(tmpPath);
      return await parser.parse();
    } finally {
      try {
        unlinkSync(tmpPath);
      } catch {
        // ignore cleanup errors
      }
    }
  });

export const importTransactions = createServerFn({ method: 'POST' })
  .inputValidator((input: ImportTransactionsInput) =>
    importTransactionsSchema.parse(input),
  )
  .handler(async ({ data }) => {
    const user = await prisma.user.findFirstOrThrow();
    const created = await prisma.expense.createManyAndReturn({
      data: data.map((item) => ({
        name: item.name,
        cost: new Decimal(item.cost).abs(),
        date: new Date(item.date),
        categoryId: item.categoryId,
        subcategoryId: item.subcategoryId ?? null,
        sourceId: item.sourceId,
        peHash: item.peHash,
        userId: user.id,
      })),
      include: { category: true },
    });

    return created.map((tx) =>
      transactionWithComponentsSchema.encode({
        ...tx,
        cost: adaptCost(tx.cost, tx.category.isIncome),
        date: dayjs(tx.date),
        actualDate: tx.actualDate ? dayjs(tx.actualDate) : null,
        components: [],
      }),
    );
  });
