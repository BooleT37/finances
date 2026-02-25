import { createQueryKeys } from '@lukemorales/query-key-factory';
import { queryOptions } from '@tanstack/react-query';
import { indexBy, prop } from 'ramda';

import { fetchAllCategories, fetchAllSubcategories } from './api';
import { categorySchema, subcategorySchema } from './schema';

// ── Categories ───────────────────────────────────────────────────────────────

const categoryKeys = createQueryKeys('categories', {
  all: { queryKey: null },
});

export const getCategoriesQueryOptions = () =>
  queryOptions({
    ...categoryKeys.all,
    staleTime: Infinity, // Reference data — rarely changes within a session
    queryFn: async () => {
      const rows = await fetchAllCategories();
      return rows.map((c) => categorySchema.decode(c));
    },
  });

export const getCategoryMapQueryOptions = () =>
  queryOptions({
    ...getCategoriesQueryOptions(),
    select: indexBy(prop('id')),
  });

// ── Subcategories ────────────────────────────────────────────────────────────

const subcategoryKeys = createQueryKeys('subcategories', {
  all: { queryKey: null },
});

export const getSubcategoriesQueryOptions = () =>
  queryOptions({
    ...subcategoryKeys.all,
    staleTime: Infinity, // Reference data — rarely changes within a session
    queryFn: async () => {
      const rows = await fetchAllSubcategories();
      return rows.map((s) => subcategorySchema.decode(s));
    },
  });

export const getSubcategoryMapQueryOptions = () =>
  queryOptions({
    ...getSubcategoriesQueryOptions(),
    select: indexBy(prop('id')),
  });
