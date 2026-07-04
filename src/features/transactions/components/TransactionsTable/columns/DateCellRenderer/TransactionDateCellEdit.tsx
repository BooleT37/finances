import { DatePickerInput } from '@mantine/dates';
import { useMolecule } from 'bunshi/react';
import dayjs from 'dayjs';
import { useSetAtom } from 'jotai';
import type { MRT_TableInstance } from 'mantine-react-table';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DATE_FORMAT } from '~/shared/constants';

import { TransactionInlineEditMolecule } from '../../transactionInlineEditMolecule';
import type { TransactionTableItem } from '../../TransactionsTable.types';

interface TransactionDateCellEditProps {
  row: TransactionTableItem;
  table: MRT_TableInstance<TransactionTableItem>;
}

export function TransactionDateCellEdit({
  row,
  table,
}: TransactionDateCellEditProps) {
  const { t } = useTranslation('transactions');
  const { updateInlineTransactionFieldAtom } = useMolecule(
    TransactionInlineEditMolecule,
  );
  const updateInlineTransactionField = useSetAtom(
    updateInlineTransactionFieldAtom,
  );
  const [opened, setOpened] = useState(true);

  const close = () => {
    setOpened(false);
    table.setEditingCell(null);
  };

  return (
    // The calendar dropdown renders in a portal, but React's synthetic events
    // still bubble through the component tree, not the DOM tree — without
    // this, a day click would also re-trigger the cell's own onClick (which
    // enters edit mode), undoing the close() below on the same click.
    <div onClick={(e) => e.stopPropagation()}>
      <DatePickerInput
        size="xs"
        aria-label={t('columns.date')}
        value={dayjs(row.date, DATE_FORMAT).toDate()}
        popoverProps={{ opened, onClose: close }}
        onChange={(date) => {
          if (date) {
            // The global error notification middleware already surfaces failures.
            void updateInlineTransactionField(row.id, {
              field: 'date',
              value: dayjs(date),
            }).catch(() => {});
          }
          close();
        }}
      />
    </div>
  );
}
