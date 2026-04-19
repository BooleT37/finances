import { Group } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import {
  MantineReactTable,
  MRT_ExpandButton,
  type MRT_TableInstance,
  useMantineReactTable,
} from 'mantine-react-table';
import { MRT_Localization_RU } from 'mantine-react-table/locales/ru/index.cjs';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { NameWithOptionalIcon } from '~/features/categories/components/NameWithOptionalIcon';
import { useSortAllCategoriesById } from '~/features/categories/facets/categoriesOrder';
import {
  getCategoriesQueryOptions,
  useUpdateCategoryOrder,
} from '~/features/categories/queries';
import type { Category } from '~/features/categories/schema';

import { useCategoriesTableColumns } from './columns/useCategoriesTableColumns';
import { RowActions } from './RowActions';

function getOrderedIds(
  table: MRT_TableInstance<Category>,
  isIncome: boolean,
): number[] {
  return table
    .getSortedRowModel()
    .flatRows.filter(
      (row) => !row.getIsGrouped() && row.original.isIncome === isIncome,
    )
    .map((row) => row.original.id);
}

export function CategoriesTable() {
  const { t } = useTranslation('categories');
  const columns = useCategoriesTableColumns();
  const { data: categories, isLoading: categoriesLoading } = useQuery(
    getCategoriesQueryOptions(),
  );
  const { sortAllCategoriesById, isSuccess: isCategoriesOrderLoaded } =
    useSortAllCategoriesById();
  const updateCategoryOrder = useUpdateCategoryOrder();

  const orderedCategories = useMemo(() => {
    if (!categories) {
      return [];
    }
    return [...categories].sort((a, b) => sortAllCategoriesById(a.id, b.id));
  }, [categories, sortAllCategoriesById]);

  const table = useMantineReactTable({
    columns,
    data: isCategoriesOrderLoaded ? orderedCategories : [],
    enableGrouping: true,
    enableTopToolbar: false,
    enableBottomToolbar: false,
    enablePagination: false,
    enableColumnActions: false,
    enableColumnDragging: false,
    enableSorting: false,
    enableRowOrdering: true,
    enableRowActions: true,
    positionActionsColumn: 'last',
    groupedColumnMode: 'remove',
    layoutMode: 'grid-no-grow',
    initialState: {
      grouping: ['isIncome'],
      expanded: true,
      density: 'xs',
      columnVisibility: { isIncome: false },
    },
    state: {
      columnOrder: ['mrt-row-drag', 'mrt-row-expand', 'mrt-row-actions'],
      isLoading: categoriesLoading || !isCategoriesOrderLoaded,
    },
    mantineTableContainerProps: {
      style: {
        maxHeight:
          'calc(100dvh - var(--app-shell-header-height) - var(--app-shell-padding) * 2 - var(--mantine-spacing-md) * 2 - 36px)',
      },
    },
    mantinePaperProps: {
      style: {
        maxWidth: 420,
      },
    },
    mantineRowDragHandleProps: ({ row, table: tbl }) => ({
      onDragEnd: () => {
        const isIncome = row.original.isIncome;
        updateCategoryOrder.mutate({
          isIncome,
          categoryIds: getOrderedIds(tbl, isIncome),
        });
      },
    }),
    renderRowActions: ({ row }) => {
      if (row.getIsGrouped()) {
        return null;
      }
      return <RowActions row={row} />;
    },
    displayColumnDefOptions: {
      'mrt-row-drag': { header: '', size: 40 },
      'mrt-row-actions': { header: '' },
      'mrt-row-expand': {
        header: t('form.name'),
        size: 280,
        Cell: ({ row, table: tbl }) => (
          <Group align="center" gap="xs" wrap="nowrap" w="100%">
            <MRT_ExpandButton row={row} table={tbl} />
            {row.getIsGrouped() ? (
              row.getGroupingValue('isIncome') ? (
                t('form.typeIncome')
              ) : (
                t('form.typeExpense')
              )
            ) : (
              <NameWithOptionalIcon
                name={row.original.name}
                icon={row.original.icon}
              />
            )}
          </Group>
        ),
      },
    },
    localization: MRT_Localization_RU,
  });

  return <MantineReactTable table={table} />;
}
