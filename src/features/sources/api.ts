import { createServerFn } from '@tanstack/react-start';

import { prisma } from '~/server/db';

import {
  sourceSchema,
  type UpdateSourceNameInput,
  updateSourceNameSchema,
  type UpdateSourceOrderInput,
  updateSourceOrderSchema,
  type UpdateSourceParserInput,
  updateSourceParserSchema,
} from './schema';

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
