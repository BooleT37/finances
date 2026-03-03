import { createServerFn } from '@tanstack/react-start';

import { prisma } from '~/server/db';

import { categorySchema } from './schema';

export const fetchAllCategories = createServerFn({ method: 'GET' }).handler(
  async () => {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { subcategories: { orderBy: { id: 'asc' } } },
    });
    return categories.map((c) => categorySchema.encode(c));
  },
);
