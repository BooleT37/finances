import { createFileRoute } from '@tanstack/react-router';

import { CategoriesPage } from '~/features/categories/components/CategoriesPage/CategoriesPage';

export const Route = createFileRoute('/_authenticated/settings/categories')({
  component: CategoriesPage,
});
