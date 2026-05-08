import { Group, Select, Text, Tooltip } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { type MRT_ColumnDef } from 'mantine-react-table';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
  useUpdateSourceName,
  useUpdateSourceParser,
} from '~/features/sources/queries';
import type { Source } from '~/features/sources/schema';
import { ExpensesParser } from '~/generated/prisma/enums';

export function useSourcesTableColumns(): MRT_ColumnDef<Source>[] {
  const { t } = useTranslation('sources');
  const updateSourceName = useUpdateSourceName();
  const updateSourceParser = useUpdateSourceParser();

  const parserOptions = useMemo(
    () => [
      { value: '', label: t('parsers.none') },
      { value: ExpensesParser.VIVID, label: t('parsers.VIVID') },
    ],
    [t],
  );

  return useMemo<MRT_ColumnDef<Source>[]>(
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
}
