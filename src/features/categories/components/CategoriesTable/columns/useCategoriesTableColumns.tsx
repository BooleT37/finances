import type { MRT_ColumnDef } from 'mantine-react-table';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { Category } from '~/features/categories/schema';

export function useCategoriesTableColumns(): MRT_ColumnDef<Category>[] {
  const { t } = useTranslation('categories');

  return useMemo<MRT_ColumnDef<Category>[]>(
    () => [
      {
        accessorKey: 'isIncome',
        header: t('form.name'),
      },
    ],
    [t],
  );
}
