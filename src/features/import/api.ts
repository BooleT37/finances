import { createServerFn } from '@tanstack/react-start';
import dayjs from 'dayjs';
import Decimal from 'decimal.js';

import { transactionWithComponentsSchema } from '~/features/transactions/schema';
import { authMiddleware } from '~/middlewares/authMiddleware';
import { trackInput } from '~/middlewares/tracking/trackInput';
import { prisma } from '~/server/db';
import { adaptCost } from '~/shared/utils/adaptCost';
import { getToday } from '~/shared/utils/today';

import { scoreCategorySuggestions } from './categorySuggestions/langfuse/scoreCategorySuggestions';
import { suggestCategoriesForProject } from './categorySuggestions/suggestCategories';
import { importedTransactionSchema } from './importedTransaction';
import {
  type ImportTransactionsInput,
  importTransactionsSchema,
  type ParsePdfExpensesInput,
  parsePdfExpensesSchema,
  type SuggestCategoriesInput,
  suggestCategoriesSchema,
} from './schema';

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
      await import('~/features/import/ExpensesParser/VividPdfExpensesParser');

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
      transactions: {
        name: 'omit',
        cost: 'send',
        date: 'send',
        importHash: 'omit',
        importedDescription: 'omit',
        categorySuggestionTrace: {
          traceId: 'sendFull',
          suggestedValue: 'send',
        },
      },
    }),
  ])
  .validator((input: ImportTransactionsInput) =>
    importTransactionsSchema.parse(input),
  )
  .handler(async ({ data, context }) => {
    const created = await prisma.$transaction(async (tx) => {
      const rows = await tx.expense.createManyAndReturn({
        data: data.transactions.map((item) => ({
          name: item.name,
          cost: new Decimal(item.cost).abs(),
          date: new Date(item.date),
          categoryId: item.categoryId,
          subcategoryId: item.subcategoryId ?? null,
          subscriptionId: item.subscriptionId ?? null,
          sourceId: data.sourceId,
          importHash: item.importHash,
          importedDescription: item.importedDescription,
          projectId: context.projectId,
        })),
        include: { category: true },
      });
      if (data.fromBank) {
        await tx.bankConnection.updateMany({
          where: { sourceId: data.sourceId, projectId: context.projectId },
          data: { lastImportedAt: getToday().toDate() },
        });
      }
      return rows;
    });
    await scoreCategorySuggestions(data.transactions, context.projectId);

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
