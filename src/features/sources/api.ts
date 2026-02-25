import { createServerFn } from '@tanstack/react-start';

import { prisma } from '~/server/db';

import { sourceSchema } from './schema';

export const fetchAllSources = createServerFn({ method: 'GET' }).handler(
  async () => {
    const sources = await prisma.source.findMany({
      orderBy: { name: 'asc' },
    });
    return sources.map((s) => sourceSchema.encode(s));
  },
);
