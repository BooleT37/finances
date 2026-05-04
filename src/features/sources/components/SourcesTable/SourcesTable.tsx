import { Group, Select, Text, Tooltip } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import {
  MantineReactTable,
  type MRT_ColumnDef,
  useMantineReactTable,
} from 'mantine-react-table';
import { MRT_Localization_RU } from 'mantine-react-table/locales/ru/index.cjs';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useOrderedSources } from '~/features/sources/facets/orderedSources';
import {
  useUpdateSourceName,
  useUpdateSourceParser,
} from '~/features/sources/queries';
import type { Source } from '~/features/sources/schema';
import { ExpensesParser } from '~/generated/prisma/enums';

import { usePersistSourcesOrder } from './hooks/usePersistSourcesOrder';

export function SourcesTable() {
  const { t } = useTranslation('sources');
  const orderedSources = useOrderedSources();
  const persistSourcesOrder = usePersistSourcesOrder();
  const updateSourceName = useUpdateSourceName();
  const updateSourceParser = useUpdateSourceParser();

  const parserOptions = useMemo(
    () => [
      { value: '', label: t('parsers.none') },
      { value: ExpensesParser.VIVID, label: t('parsers.VIVID') },
    ],
    [t],
  );

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
      {
        accessorKey: 'parser',
        header: t('columns.parser'),
        Header: () => (
          <Group gap={4} wrap="nowrap">
            <Text size="sm" fw={700}>
              {t('columns.parser')}
            </Text>
            <Tooltip
              label={t('columns.parserTooltip')}
              multiline
              maw={280}
              withArrow
            >
              <IconInfoCircle size={14} style={{ cursor: 'help' }} />
            </Tooltip>
          </Group>
        ),
        enableEditing: false,
        size: 160,
        Cell: ({ row }) => (
          <Select
            value={row.original.parser ?? ''}
            data={parserOptions}
            size="xs"
            variant="unstyled"
            allowDeselect={false}
            onChange={(val) =>
              updateSourceParser.mutate({
                id: row.original.id,
                parser: val === '' ? null : (val as ExpensesParser),
              })
            }
          />
        ),
      },
    ],
    [t, updateSourceName, updateSourceParser, parserOptions],
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
    localization: MRT_Localization_RU,
  });

  return <MantineReactTable table={table} />;
}
