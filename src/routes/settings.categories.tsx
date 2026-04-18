import { createFileRoute } from '@tanstack/react-router';

import { CategoriesPage } from '~/features/categories/components/CategoriesPage/CategoriesPage';

export const Route = createFileRoute('/settings/categories')({
  component: CategoriesPage,
});
