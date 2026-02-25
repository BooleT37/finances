import { createServerFn } from '@tanstack/react-start';

import { prisma } from '~/server/db';

import { categorySchema, subcategorySchema } from './schema';

export const fetchAllCategories = createServerFn({ method: 'GET' }).handler(
  async () => {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    return categories.map((c) => categorySchema.encode(c));
  },
);

export const fetchAllSubcategories = createServerFn({
  method: 'GET',
}).handler(async () => {
  const subcategories = await prisma.subcategory.findMany({
    orderBy: { name: 'asc' },
  });
  return subcategories.map((s) => subcategorySchema.encode(s));
});
