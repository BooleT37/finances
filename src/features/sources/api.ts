import { createServerFn } from '@tanstack/react-start';

import { authMiddleware } from '~/middlewares/authMiddleware';
import { prisma } from '~/server/db';
import { assertOwnedByProject } from '~/shared/utils/assertOwnedByProject';

import {
  type CreateSourceInput,
  createSourceSchema,
  sourceSchema,
  type UpdateSourceNameInput,
  updateSourceNameSchema,
  type UpdateSourceOrderInput,
  updateSourceOrderSchema,
  type UpdateSourceParserInput,
  updateSourceParserSchema,
} from './schema';

export const createSource = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((input: CreateSourceInput) => createSourceSchema.parse(input))
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
  .middleware([authMiddleware])
  .inputValidator((input: UpdateSourceNameInput) =>
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

export const updateSourceParser = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((input: UpdateSourceParserInput) =>
    updateSourceParserSchema.parse(input),
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
      data: { parser: data.parser },
    });
    return sourceSchema.encode(updated);
  });

export const updateSourceOrder = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((input: UpdateSourceOrderInput) =>
    updateSourceOrderSchema.parse(input),
  )
  .handler(async ({ data, context }) => {
    await prisma.projectSetting.update({
      where: { projectId: context.projectId },
      data: { sourcesOrder: data.sourceIds },
    });
  });

export const deleteSource = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((id: number) => id)
  .handler(async ({ data: id, context }) => {
    await assertOwnedByProject(prisma.source, id, context.projectId, 'Source');

    await prisma.$transaction(async (tx) => {
      // Subscription/Expense.sourceId use onDelete: SetNull, so no need to
      // null them out manually.
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
