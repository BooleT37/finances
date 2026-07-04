import { Select } from '@mantine/core';
import { useMolecule } from 'bunshi/react';
import { useSetAtom } from 'jotai';
import type { MRT_TableInstance } from 'mantine-react-table';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useOrderedSources } from '~/features/sources/facets/orderedSources';

import { TransactionInlineEditMolecule } from '../../transactionInlineEditMolecule';
import type { TransactionTableItem } from '../../TransactionsTable.types';

interface TransactionSourceCellEditProps {
  row: TransactionTableItem;
  table: MRT_TableInstance<TransactionTableItem>;
}

export function TransactionSourceCellEdit({
  row,
  table,
}: TransactionSourceCellEditProps) {
  const { t } = useTranslation('transactions');
  const sources = useOrderedSources();
  const { updateInlineTransactionFieldAtom } = useMolecule(
    TransactionInlineEditMolecule,
  );
  const updateInlineTransactionField = useSetAtom(
    updateInlineTransactionFieldAtom,
  );
  const [opened, setOpened] = useState(true);

  const data = useMemo(
    () => (sources ?? []).map((s) => ({ value: String(s.id), label: s.name })),
    [sources],
  );

  const close = () => {
    setOpened(false);
    table.setEditingCell(null);
  };

  return (
    // Combobox options render in a portal, but React's synthetic events still
    // bubble through the component tree, not the DOM tree — without this, an
    // option click would also re-trigger the cell's own onClick (which enters
    // edit mode), undoing the close() below on the same click.
    <div onClick={(e) => e.stopPropagation()}>
      <Select
        size="xs"
        aria-label={t('columns.source')}
        searchable
        clearable
        data={data}
        value={row.sourceId !== null ? String(row.sourceId) : null}
        dropdownOpened={opened}
        onDropdownClose={close}
        onChange={(value) => {
          // The global error notification middleware already surfaces failures.
          void updateInlineTransactionField(row.id, {
            field: 'sourceId',
            value: value !== null ? Number(value) : null,
          }).catch(() => {});
          close();
        }}
      />
    </div>
  );
}
