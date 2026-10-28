import { Group, Text, Tooltip } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { type MRT_ColumnDef } from 'mantine-react-table-open';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { ConnectedUntilCell } from '~/features/import/components/BankConnection/ConnectedUntilCell';
import { useBankImportAvailable } from '~/features/import/components/BankConnection/useBankConnection';
import { useUpdateSourceName } from '~/features/sources/queries';
import type { Source } from '~/features/sources/schema';
import { Bank } from '~/generated/prisma/enums';
import { openCellForEditing } from '~/shared/utils/table/openCellForEditing';

import { BankCell } from './BankCell';

export function useSourcesTableColumns(): MRT_ColumnDef<Source>[] {
  const { t } = useTranslation('sources');
  const updateSourceName = useUpdateSourceName();
  const bankImportAvailable = useBankImportAvailable();

  const bankOptions = useMemo(
    () => [
      { value: '', label: t('banks.none') },
      { value: Bank.VIVID, label: t('banks.VIVID') },
      { value: Bank.COMMERZBANK, label: t('banks.COMMERZBANK') },
    ],
    [t],
  );

  return useMemo<MRT_ColumnDef<Source>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('columns.name'),
        enableEditing: true,
        mantineTableBodyCellProps: ({ cell, table }) => ({
          onClick: () => openCellForEditing(table, cell),
        }),
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
        accessorKey: 'bank',
        header: t('columns.bank'),
        Header: () => (
          <Group gap={4} wrap="nowrap">
            <Text size="sm" fw={700}>
              {t('columns.bank')}
            </Text>
            <Tooltip
              label={t('columns.bankTooltip')}
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
          <BankCell source={row.original} bankOptions={bankOptions} />
        ),
      },
      ...(bankImportAvailable
        ? [
            {
              id: 'bankConnection',
              header: t('columns.connectedUntil'),
              enableEditing: false,
              size: 150,
              Cell: ({ row }) => (
                <ConnectedUntilCell sourceId={row.original.id} />
              ),
            } satisfies MRT_ColumnDef<Source>,
          ]
        : []),
    ],
    [t, updateSourceName, bankOptions, bankImportAvailable],
  );
}
