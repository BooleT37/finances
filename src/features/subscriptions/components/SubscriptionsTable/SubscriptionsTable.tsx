import { Group } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import {
  MantineReactTable,
  MRT_ExpandButton,
  useMantineReactTable,
} from 'mantine-react-table';
import { MRT_Localization_RU } from 'mantine-react-table/locales/ru/index.cjs';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getCategoryMapQueryOptions } from '~/features/categories/facets/categoryMap';
import { getOrThrow } from '~/shared/utils/getOrThrow';

import { useSortedSubscriptions } from '../../facets/sortedSubscriptions';
import { useSubscriptionTableColumns } from './columns/useSubscriptionTableColumns';
import { flashEffectAtom, flashStateAtom } from './flashSubscription';
import { RowActions } from './RowActions';

interface Props {
  mode: 'active' | 'archived';
}

export function SubscriptionsTable({ mode }: Props) {
  const { t } = useTranslation('subscriptions');
  const sorted = useSortedSubscriptions();
  const { data: categoryMap = {} } = useQuery(getCategoryMapQueryOptions());

  const filtered = useMemo(
    () => sorted?.filter((s) => s.active === (mode === 'active')),
    [sorted, mode],
  );

  const { id: flashId, fading } = useAtomValue(flashStateAtom);

  const columns = useSubscriptionTableColumns();

  const table = useMantineReactTable({
    columns,
    data: filtered ?? [],
    enableGrouping: true,
    enableTopToolbar: false,
    enableBottomToolbar: false,
    enablePagination: false,
    enableColumnActions: false,
    enableColumnDragging: false,
    enableSorting: false,
    enableRowOrdering: false,
    enableRowActions: true,
    enableTableFooter: true,
    positionActionsColumn: 'last',
    groupedColumnMode: 'remove',
    layoutMode: 'grid-no-grow',
    initialState: {
      grouping: ['categoryId'],
      expanded: true,
      density: 'xs',
      columnVisibility: { categoryId: false },
    },
    state: {
      columnOrder: [
        'mrt-row-expand',
        'price',
        'firstDate',
        'sourceId',
        'mrt-row-actions',
      ],
      isLoading: !sorted,
    },
    mantineTableContainerProps: {
      style: {
        maxHeight:
          'calc(100dvh - var(--app-shell-header-height) - var(--app-shell-padding) * 2 - var(--mantine-spacing-md) * 2 - 36px)',
      },
    },
    mantinePaperProps: {
      style: { maxWidth: 640 },
    },
    mantineTableBodyCellProps: ({ row }) => {
      const isFlashing = !row.getIsGrouped() && row.original.id === flashId;
      return {
        style: {
          background: isFlashing
            ? fading
              ? 'transparent'
              : '#fffde7'
            : undefined,
          transition:
            isFlashing && fading ? 'background 1.5s ease-out' : undefined,
        },
      };
    },
    renderRowActions: ({ row }) => {
      if (row.getIsGrouped()) {
        return null;
      }
      return <RowActions row={row} mode={mode} />;
    },
    displayColumnDefOptions: {
      'mrt-row-actions': { header: '', size: 100 },
      'mrt-row-expand': {
        header: t('columns.name'),
        size: 220,
        Cell: ({ row, table: tbl }) => (
          <Group align="center" gap="xs" wrap="nowrap" w="100%">
            <MRT_ExpandButton row={row} table={tbl} />
            {row.getIsGrouped()
              ? getOrThrow(
                  categoryMap,
                  Number(row.getGroupingValue('categoryId')),
                  'Category',
                ).name
              : row.original.name}
          </Group>
        ),
      },
    },
    localization: MRT_Localization_RU,
  });

  const flashEffect = useMemo(() => flashEffectAtom(table), [table]);
  useAtomValue(flashEffect);

  return <MantineReactTable table={table} />;
}
