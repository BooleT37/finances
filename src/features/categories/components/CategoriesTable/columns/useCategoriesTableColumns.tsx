import type { MRT_ColumnDef } from 'mantine-react-table';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { CategoryIconComp } from '~/features/categories/components/categoryIcons/CategoryIconComp';
import { NameWithOptionalIcon } from '~/features/categories/components/NameWithOptionalIcon';
import type { Category } from '~/features/categories/schema';

export function useCategoriesTableColumns(): MRT_ColumnDef<Category>[] {
  const { t } = useTranslation('categories');

  return useMemo<MRT_ColumnDef<Category>[]>(
    () => [
      {
        accessorKey: 'isIncome',
        header: t('form.type'),
      },
      {
        accessorKey: 'icon',
        header: t('form.icon'),
        size: 50,
        Cell: ({ cell }) => {
          const icon = cell.getValue<string | null>();
          return icon ? <CategoryIconComp value={icon} /> : null;
        },
      },
      {
        accessorKey: 'name',
        header: t('form.name'),
        Cell: ({ row }) => (
          <NameWithOptionalIcon
            name={row.original.name}
            icon={row.original.icon}
          />
        ),
      },
      {
        accessorKey: 'shortname',
        header: t('form.shortname'),
      },
      {
        accessorKey: 'isContinuous',
        header: t('form.isContinuous'),
        size: 80,
        Cell: ({ cell }) => (cell.getValue<boolean>() ? '✓' : ''),
      },
    ],
    [t],
  );
}
