import {
  MantineReactTable,
  type MRT_ColumnDef,
  useMantineReactTable,
} from 'mantine-react-table';
import { MRT_Localization_RU } from 'mantine-react-table/locales/ru/index.cjs';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useOrderedSources } from '~/features/sources/facets/orderedSources';
import { useUpdateSourceName } from '~/features/sources/queries';
import type { Source } from '~/features/sources/schema';

import { usePersistSourcesOrder } from './hooks/usePersistSourcesOrder';

export function SourcesTable() {
  const { t } = useTranslation('sources');
  const orderedSources = useOrderedSources();
  const persistSourcesOrder = usePersistSourcesOrder();
  const updateSourceName = useUpdateSourceName();

  const columns = useMemo<MRT_ColumnDef<Source>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('columns.name'),
        enableEditing: true,
        mantineEditTextInputProps: ({ row }) => ({
          onBlur: (e) => {
            const newName = e.target.value.trim();
            if (newName && newName !== row.original.name) {
              updateSourceName.mutate({ id: row.original.id, name: newName });
            }
          },
        }),
      },
    ],
    [t, updateSourceName],
  );

  const table = useMantineReactTable({
    columns,
    data: orderedSources ?? [],
    enableEditing: true,
    editDisplayMode: 'cell',
    enableRowOrdering: true,
    enableSorting: false,
    enableTopToolbar: false,
    enableBottomToolbar: false,
    enablePagination: false,
    enableColumnActions: false,
    enableColumnDragging: false,
    layoutMode: 'grid-no-grow',
    initialState: { density: 'xs' },
    state: {
      columnOrder: ['mrt-row-drag', 'name'],
      isLoading: !orderedSources,
    },
    mantinePaperProps: { style: { maxWidth: 320 } },
    mantineTableContainerProps: {
      style: {
        maxHeight:
          'calc(100dvh - var(--app-shell-header-height) - var(--app-shell-padding) * 2 - var(--mantine-spacing-md) * 2 - 36px)',
      },
    },
    displayColumnDefOptions: {
      'mrt-row-drag': { header: '', size: 40 },
    },
    mantineRowDragHandleProps: ({ table: tbl }) => ({
      onDragEnd: () => persistSourcesOrder(tbl),
    }),
    localization: MRT_Localization_RU,
  });

  return <MantineReactTable table={table} />;
}
