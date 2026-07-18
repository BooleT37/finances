import { Badge } from '@mantine/core';
import { type MRT_ColumnDef } from 'mantine-react-table-open';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { ProjectUser } from '~/features/projectUsers/schema';

export function useProjectUsersTableColumns(): MRT_ColumnDef<ProjectUser>[] {
  const { t } = useTranslation('projectUsers');

  return useMemo<MRT_ColumnDef<ProjectUser>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('columns.name'),
      },
      {
        accessorKey: 'email',
        header: t('columns.email'),
      },
      {
        accessorKey: 'role',
        header: t('columns.role'),
        size: 120,
        Cell: ({ row }) => (
          <Badge
            color={row.original.role === 'admin' ? 'blue' : 'gray'}
            variant="light"
          >
            {t(`roles.${row.original.role}` as 'roles.admin' | 'roles.user')}
          </Badge>
        ),
      },
    ],
    [t],
  );
}
