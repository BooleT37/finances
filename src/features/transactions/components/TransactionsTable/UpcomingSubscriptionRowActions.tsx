import { ActionIcon, Tooltip } from '@mantine/core';
import { IconCalendarPlus } from '@tabler/icons-react';
import { useMolecule } from 'bunshi/react';
import { useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { TableFlash, useFlashTrigger } from '~/shared/hooks/useTableFlash';

import { TransactionSidebarMolecule } from '../TransactionSidebar/transactionSidebarMolecule';
import type { TransactionTableItem } from './TransactionsTable.types';

interface Props {
  row: TransactionTableItem;
}

export function UpcomingSubscriptionRowActions({ row }: Props) {
  const { createFromSubscriptionAtom } = useMolecule(
    TransactionSidebarMolecule,
  );
  const createFromSubscription = useSetAtom(createFromSubscriptionAtom);
  const triggerFlash = useFlashTrigger(TableFlash.Transactions);
  const { t } = useTranslation('transactions');

  const handleCreate = () => {
    createFromSubscription({
      row,
      onCreated: (id) => {
        triggerFlash([{ id }]);
      },
    });
  };

  return (
    <Tooltip label={t('actions.createFromSubscription')}>
      <ActionIcon
        variant="subtle"
        aria-label={t('actions.createFromSubscription')}
        onClick={handleCreate}
      >
        <IconCalendarPlus size={16} />
      </ActionIcon>
    </Tooltip>
  );
}
