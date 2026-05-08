import { createServerFn } from '@tanstack/react-start';

import { prisma } from '~/server/db';

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
  .inputValidator((input: CreateSourceInput) => createSourceSchema.parse(input))
  .handler(async ({ data }) => {
    const user = await prisma.user.findFirstOrThrow();
    const created = await prisma.source.create({
      data: { name: data.name, userId: user.id },
    });

    const settings = await prisma.userSetting.findFirst({
      where: { userId: user.id },
    });
    if (settings) {
      await prisma.userSetting.update({
        where: { userId: user.id },
        data: { sourcesOrder: [...settings.sourcesOrder, created.id] },
      });
    }

    return sourceSchema.encode(created);
  });

export const fetchAllSources = createServerFn({ method: 'GET' }).handler(
  async () => {
    const sources = await prisma.source.findMany({
      orderBy: { name: 'asc' },
    });
    return sources.map((s) => sourceSchema.encode(s));
  },
);

export const updateSourceName = createServerFn({ method: 'POST' })
  .inputValidator((input: UpdateSourceNameInput) =>
    updateSourceNameSchema.parse(input),
  )
  .handler(async ({ data }) => {
    const updated = await prisma.source.update({
      where: { id: data.id },
      data: { name: data.name },
    });
    return sourceSchema.encode(updated);
  });

export const updateSourceParser = createServerFn({ method: 'POST' })
  .inputValidator((input: UpdateSourceParserInput) =>
    updateSourceParserSchema.parse(input),
  )
  .handler(async ({ data }) => {
    const updated = await prisma.source.update({
      where: { id: data.id },
      data: { parser: data.parser },
    });
    return sourceSchema.encode(updated);
  });

export const updateSourceOrder = createServerFn({ method: 'POST' })
  .inputValidator((input: UpdateSourceOrderInput) =>
    updateSourceOrderSchema.parse(input),
  )
  .handler(async ({ data }) => {
    const user = await prisma.user.findFirstOrThrow();
    await prisma.userSetting.update({
      where: { userId: user.id },
      data: { sourcesOrder: data.sourceIds },
    });
  });

export const deleteSource = createServerFn({ method: 'POST' })
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }) => {
    await prisma.$transaction(async (tx) => {
      // Subscription/Expense.sourceId use onDelete: SetNull, so no need to
      // null them out manually.
      await tx.source.delete({ where: { id } });

      const user = await tx.user.findFirstOrThrow();
      const settings = await tx.userSetting.findFirst({
        where: { userId: user.id },
      });
      if (settings) {
        await tx.userSetting.update({
          where: { userId: user.id },
          data: {
            sourcesOrder: settings.sourcesOrder.filter((sId) => sId !== id),
          },
        });
      }
    });
  });
