import { createServerFn } from '@tanstack/react-start';

import { authMiddleware } from '~/middlewares/authMiddleware';
import { trackInput } from '~/middlewares/tracking/trackInput';
import { prisma } from '~/server/db';
import { assertOwnedByProject } from '~/shared/utils/assertOwnedByProject';

import {
  type CreateSourceInput,
  createSourceSchema,
  sourceSchema,
  type UpdateSourceBankInput,
  updateSourceBankSchema,
  type UpdateSourceNameInput,
  updateSourceNameSchema,
  type UpdateSourceOrderInput,
  updateSourceOrderSchema,
} from './schema';

export const createSource = createServerFn({ method: 'POST' })
  .middleware([authMiddleware, trackInput<CreateSourceInput>({ name: 'send' })])
  .validator((input: CreateSourceInput) => createSourceSchema.parse(input))
  .handler(async ({ data, context }) => {
    const created = await prisma.source.create({
      data: { name: data.name, projectId: context.projectId },
    });

    const settings = await prisma.projectSetting.findFirst({
      where: { projectId: context.projectId },
    });
    if (settings) {
      await prisma.projectSetting.update({
        where: { projectId: context.projectId },
        data: { sourcesOrder: [...settings.sourcesOrder, created.id] },
      });
    }

    return sourceSchema.encode(created);
  });

export const fetchAllSources = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sources = await prisma.source.findMany({
      where: { projectId: context.projectId },
      orderBy: { name: 'asc' },
    });
    return sources.map((s) => sourceSchema.encode(s));
  });

export const updateSourceName = createServerFn({ method: 'POST' })
  .middleware([
    authMiddleware,
    trackInput<UpdateSourceNameInput>({ name: 'send' }),
  ])
  .validator((input: UpdateSourceNameInput) =>
    updateSourceNameSchema.parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertOwnedByProject(
      prisma.source,
      data.id,
      context.projectId,
      'Source',
    );
    const updated = await prisma.source.update({
      where: { id: data.id },
      data: { name: data.name },
    });
    return sourceSchema.encode(updated);
  });

export const updateSourceBank = createServerFn({ method: 'POST' })
  .middleware([
    authMiddleware,
    trackInput<UpdateSourceBankInput>({ bank: 'send' }),
  ])
  .validator((input: UpdateSourceBankInput) =>
    updateSourceBankSchema.parse(input),
  )
  .handler(async ({ data, context }) => {
    const updated = await prisma.$transaction(async (tx) => {
      await assertOwnedByProject(
        tx.source,
        data.id,
        context.projectId,
        'Source',
      );
      const bankConnection = await tx.bankConnection.findUnique({
        where: {
          sourceId_projectId: {
            sourceId: data.id,
            projectId: context.projectId,
          },
        },
      });
      if (bankConnection) {
        throw new Error(
          "A connected source's bank can't change. Disconnect it first",
        );
      }
      return tx.source.update({
        where: { id: data.id },
        data: { bank: data.bank },
      });
    });
    return sourceSchema.encode(updated);
  });

export const updateSourceOrder = createServerFn({ method: 'POST' })
  .middleware([authMiddleware, trackInput<UpdateSourceOrderInput>()])
  .validator((input: UpdateSourceOrderInput) =>
    updateSourceOrderSchema.parse(input),
  )
  .handler(async ({ data, context }) => {
    await prisma.projectSetting.update({
      where: { projectId: context.projectId },
      data: { sourcesOrder: data.sourceIds },
    });
  });

export const deleteSource = createServerFn({ method: 'POST' })
  .middleware([authMiddleware, trackInput<number>()])
  .validator((id: number) => id)
  .handler(async ({ data: id, context }) => {
    await assertOwnedByProject(prisma.source, id, context.projectId, 'Source');

    await prisma.$transaction(async (tx) => {
      // Composite FK can't SetNull — null the references first.
      await tx.subscription.updateMany({
        where: { sourceId: id, projectId: context.projectId },
        data: { sourceId: null },
      });
      await tx.expense.updateMany({
        where: { sourceId: id, projectId: context.projectId },
        data: { sourceId: null },
      });
      await tx.source.delete({ where: { id } });

      const settings = await tx.projectSetting.findFirst({
        where: { projectId: context.projectId },
      });
      if (settings) {
        await tx.projectSetting.update({
          where: { projectId: context.projectId },
          data: {
            sourcesOrder: settings.sourcesOrder.filter((sId) => sId !== id),
          },
        });
      }
    });
  });
