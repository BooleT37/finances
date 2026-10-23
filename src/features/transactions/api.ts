import { createServerFn } from '@tanstack/react-start';
import dayjs from 'dayjs';
import Decimal from 'decimal.js';
import pMap from 'p-map';

import { authMiddleware } from '~/middlewares/authMiddleware';
import { prisma } from '~/server/db';
import { typesafe } from '~/server/typesafe';
import { adaptCost } from '~/shared/utils/adaptCost';
import { assertOwnedByProject } from '~/shared/utils/assertOwnedByProject';
import { findByIdOrThrow } from '~/shared/utils/getOrThrow';

import { buildCategoryJevCriteria } from './categorySuggestions/categoryJevCriteria';
import { buildCategoryJevQuestion } from './categorySuggestions/categoryJevQuestion';
import {
  CATEGORY_SUGGESTION_CONCURRENCY,
  SIMILAR_TRANSACTIONS_LIMIT,
  toCategorySuggestion,
} from './categorySuggestions/categorySuggestion';
import { parsedExpenseSchema } from './parsedExpense';
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
  .inputValidator((year: number) => year)
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
  .middleware([authMiddleware])
  .inputValidator((input: NewTransactionInput) =>
    newTransactionSchema.parse(input),
  )
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
  .middleware([authMiddleware])
  .inputValidator((id: number) => id)
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
  .middleware([authMiddleware])
  .inputValidator((input: UpdateTransactionInput) =>
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
  .middleware([authMiddleware])
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
      const parsedExpenses = await parser.parse();
      return parsedExpenses.map((parsedExpense) =>
        parsedExpenseSchema.encode(parsedExpense),
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
  .middleware([authMiddleware])
  .inputValidator((input: ImportTransactionsInput) =>
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
        peHash: item.peHash,
        importedDescription: item.importedDescription,
        projectId: context.projectId,
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

export const suggestCategories = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((input: SuggestCategoriesInput) =>
    suggestCategoriesSchema.parse(input),
  )
  .handler(async ({ data, context }) => {
    if (!typesafe) {
      throw new Error('Category suggestions need TYPESAFE_API_KEY to be set');
    }
    const jev = typesafe;
    await assertOwnedByProject(
      prisma.source,
      data.sourceId,
      context.projectId,
      'Source',
    );

    const [categories, subscriptions] = await Promise.all([
      prisma.category.findMany({
        where: { projectId: context.projectId },
        include: { subcategories: true },
      }),
      prisma.subscription.findMany({
        where: { projectId: context.projectId },
      }),
    ]);
    const offeredSubscriptions = subscriptions.filter((s) =>
      data.subscriptionIds.includes(s.id),
    );

    const findSimilarTransactions = (description: string, isIncome: boolean) =>
      prisma.$transaction(async (tx) => {
        const ranked = await tx.$queryRaw<{ id: number }[]>`
          SELECT e.id
          FROM "Expense" e
          JOIN "Category" c ON c.id = e."categoryId" AND c."projectId" = e."projectId"
          WHERE e."projectId" = ${context.projectId}
            AND e."sourceId" = ${data.sourceId}
            AND e."importedDescription" IS NOT NULL
            AND c."isIncome" = ${isIncome}
            AND similarity(e."importedDescription", ${description}) > 0
          ORDER BY similarity(e."importedDescription", ${description}) DESC,
                   e.date, e.id
          LIMIT ${SIMILAR_TRANSACTIONS_LIMIT}
        `;
        const transactions = await tx.expense.findMany({
          where: { id: { in: ranked.map(({ id }) => id) } },
          include: { category: true },
        });
        return ranked.map(({ id }) =>
          findByIdOrThrow(transactions, id, 'Similar transaction'),
        );
      });

    return pMap(
      data.parsedExpenses,
      async (parsedExpense) => {
        const isIncome = !parsedExpense.amount.isNegative();
        const criteria = buildCategoryJevCriteria({
          categories,
          subscriptions: offeredSubscriptions,
          isIncome,
        });
        const { state, question } = buildCategoryJevQuestion(
          parsedExpense,
          criteria,
          await findSimilarTransactions(parsedExpense.description, isIncome),
          subscriptions,
        );
        const answer = await jev.askChoice(state, question);
        return toCategorySuggestion({
          answer,
          criteria,
          subscriptions,
          similarCount: state.similar_past_transactions.length,
        });
      },
      { concurrency: CATEGORY_SUGGESTION_CONCURRENCY },
    );
  });
