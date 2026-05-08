import { MantineReactTable, useMantineReactTable } from 'mantine-react-table';
import { MRT_Localization_RU } from 'mantine-react-table/locales/ru/index.cjs';
import { useEffect } from 'react';

import { useOrderedSources } from '~/features/sources/facets/orderedSources';
import type { Source } from '~/features/sources/schema';
import { TableFlash, useTableFlash } from '~/shared/hooks/useTableFlash';

import { useSourcesTableColumns } from './columns/useSourcesTableColumns';
import { usePersistSourcesOrder } from './hooks/usePersistSourcesOrder';

export function SourcesTable() {
  const orderedSources = useOrderedSources();
  const persistSourcesOrder = usePersistSourcesOrder();
  const columns = useSourcesTableColumns();
  const { withFlashingStyles, setTable } = useTableFlash<Source>(
    TableFlash.Sources,
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
      columnOrder: ['mrt-row-drag', 'name', 'parser'],
      isLoading: !orderedSources,
    },
    mantinePaperProps: { style: { maxWidth: 480 } },
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
    mantineTableBodyCellProps: ({ row }) => ({
      style: withFlashingStyles(row),
    }),
    localization: MRT_Localization_RU,
  });

  useEffect(() => {
    setTable(table);
  });

  return <MantineReactTable table={table} />;
}
