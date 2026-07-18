import { Button, Group, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import {
  MantineReactTable,
  useMantineReactTable,
} from 'mantine-react-table-open';
import { useTranslation } from 'react-i18next';

import { useTableLocalization } from '~/shared/hooks/useTableLocalization';

import { getProjectUsersQueryOptions } from '../../queries';
import { CreateProjectUserModal } from '../CreateProjectUserModal';
import { useProjectUsersTableColumns } from './columns/useProjectUsersTableColumns';
import { RowActions } from './RowActions';

export function ProjectUsersTable() {
  const { t } = useTranslation('projectUsers');
  const { data: users } = useQuery(getProjectUsersQueryOptions());
  const [createOpened, { open: openCreate, close: closeCreate }] =
    useDisclosure(false);

  const columns = useProjectUsersTableColumns();
  const tableLocalization = useTableLocalization();

  const table = useMantineReactTable({
    columns,
    data: users ?? [],
    getRowId: (row) => row.id,
    enableTopToolbar: false,
    enableBottomToolbar: false,
    enablePagination: false,
    enableColumnActions: false,
    enableColumnDragging: false,
    enableSorting: false,
    enableRowActions: true,
    positionActionsColumn: 'last',
    layoutMode: 'grid-no-grow',
    initialState: { density: 'xs' },
    state: { isLoading: !users },
    mantinePaperProps: { style: { width: 'fit-content' } },
    displayColumnDefOptions: {
      'mrt-row-actions': { header: '', size: 100 },
    },
    renderRowActions: ({ row }) => <RowActions row={row} />,
    localization: tableLocalization,
  });

  return (
    <>
      <Group justify="space-between" mb="md">
        <Title order={3}>{t('pageTitle')}</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          {t('addUser')}
        </Button>
      </Group>

      <MantineReactTable table={table} />

      <CreateProjectUserModal opened={createOpened} onClose={closeCreate} />
    </>
  );
}
