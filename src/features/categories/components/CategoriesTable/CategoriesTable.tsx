import { Group } from '@mantine/core';
import {
  MantineReactTable,
  MRT_ExpandButton,
  useMantineReactTable,
} from 'mantine-react-table';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { NameWithOptionalIcon } from '~/features/categories/components/NameWithOptionalIcon';
import { useCategoryTableItems } from '~/features/categories/facets/categoryTableItems';
import type { Category } from '~/features/categories/schema';
import { TableFlash, useTableFlash } from '~/shared/hooks/useTableFlash';
import { useTableLocalization } from '~/shared/hooks/useTableLocalization';

import { useCategoriesTableColumns } from './columns/useCategoriesTableColumns';
import { usePersistCategoriesOrder } from './hooks/usePersistCategoriesOrder';
import { RowActions } from './RowActions';

export function CategoriesTable() {
  const { t } = useTranslation('categories');
  const columns = useCategoriesTableColumns();
  const categoryTableItems = useCategoryTableItems();
  const persistCategoriesOrder = usePersistCategoriesOrder();

  const { withFlashingStyles, setTable } = useTableFlash<Category>(
    TableFlash.Categories,
  );

  const tableLocalization = useTableLocalization();

  const table = useMantineReactTable({
    columns,
    data: categoryTableItems ?? [],
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
      isLoading: !categoryTableItems,
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
    mantineTableBodyCellProps: ({ row }) => ({
      style: withFlashingStyles(row),
    }),
    mantineRowDragHandleProps: ({ row, table: tbl }) => ({
      onDragEnd: () => persistCategoriesOrder(tbl, row.original.isIncome),
    }),
    renderRowActions: ({ row }) => {
      if (row.getIsGrouped()) {
        return null;
      }
      return <RowActions row={row} />;
    },
    displayColumnDefOptions: {
      'mrt-row-drag': { header: '', size: 40 },
      'mrt-row-actions': { header: '', size: 80 },
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
    localization: tableLocalization,
  });

  useEffect(() => {
    setTable(table);
  });

  return <MantineReactTable table={table} />;
}
