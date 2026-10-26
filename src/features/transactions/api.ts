import { createServerFn } from '@tanstack/react-start';
import dayjs from 'dayjs';
import Decimal from 'decimal.js';

import { authMiddleware } from '~/middlewares/authMiddleware';
import { trackInput } from '~/middlewares/tracking/trackInput';
import { prisma } from '~/server/db';
import { adaptCost } from '~/shared/utils/adaptCost';
import { assertOwnedByProject } from '~/shared/utils/assertOwnedByProject';

import { scoreCategorySuggestions } from './categorySuggestions/langfuse/scoreCategorySuggestions';
import { suggestCategoriesForProject } from './categorySuggestions/suggestCategories';
import { importedTransactionSchema } from './importedTransaction';
import {
  type ImportTransactionsInput,
  importTransactionsSchema,
  type NewTransactionInput,
  newTransactionSchema,
  type ParsePdfExpensesInput,
  parsePdfExpensesSchema,
  type SuggestCategoriesInput,
  suggestCategoriesSchema,
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

export const parsePdfExpenses = createServerFn({ method: 'POST' })
  .middleware([
    authMiddleware,
    trackInput<ParsePdfExpensesInput>({ fileBase64: 'length', parser: 'send' }),
  ])
  .validator((input: ParsePdfExpensesInput) =>
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
      const importedTransactions = await parser.parse();
      return importedTransactions.map((importedTransaction) =>
        importedTransactionSchema.encode(importedTransaction),
      );
    } finally {
      try {
        unlinkSync(tmpPath);
      } catch {
        // ignore cleanup errors
      }
    }
  });

export const importTransactions = createServerFn({ method: 'POST' })
  .middleware([
    authMiddleware,
    trackInput<ImportTransactionsInput>({
      name: 'omit',
      cost: 'send',
      date: 'send',
      importHash: 'omit',
      importedDescription: 'omit',
      categorySuggestionTrace: { traceId: 'sendFull', suggestedValue: 'send' },
    }),
  ])
  .validator((input: ImportTransactionsInput) =>
    importTransactionsSchema.parse(input),
  )
  .handler(async ({ data, context }) => {
    const created = await prisma.expense.createManyAndReturn({
      data: data.map((item) => ({
        name: item.name,
        cost: new Decimal(item.cost).abs(),
        date: new Date(item.date),
        categoryId: item.categoryId,
        subcategoryId: item.subcategoryId ?? null,
        subscriptionId: item.subscriptionId ?? null,
        sourceId: item.sourceId,
        importHash: item.importHash,
        importedDescription: item.importedDescription,
        projectId: context.projectId,
      })),
      include: { category: true },
    });
    await scoreCategorySuggestions(data, context.projectId);

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

export const suggestCategories = createServerFn({ method: 'POST' })
  .middleware([
    authMiddleware,
    trackInput<SuggestCategoriesInput>({
      importedTransactions: {
        date: 'send',
        type: 'send',
        description: 'omit',
        amount: 'send',
        hash: 'omit',
      },
    }),
  ])
  .validator((input: SuggestCategoriesInput) =>
    suggestCategoriesSchema.parse(input),
  )
  .handler(({ data, context }) => suggestCategoriesForProject(data, context));
