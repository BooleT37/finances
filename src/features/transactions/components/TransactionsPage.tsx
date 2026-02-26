import {
  Button,
  Checkbox,
  Group,
  Loader,
  Stack,
  TextInput,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getUserSettingsQueryOptions } from '~/features/userSettings/queries';

import { useTransactionTableItems } from '../useTransactionTableItems';
import { ImportModal } from './ImportModal';
import { TransactionModal } from './TransactionModal';
import { TransactionTable } from './TransactionTable';

export function TransactionsPage() {
  const { t } = useTranslation('transactions');
  const [search, setSearch] = useState('');
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [groupBySubcategories, setGroupBySubcategories] = useState(false);

  const items = useTransactionTableItems({
    showUpcoming,
    searchString: search,
  });
  const { isSuccess: userSettingsLoaded } = useQuery(
    getUserSettingsQueryOptions(),
  );

  return (
    <Stack>
      <Group justify="space-between">
        <Group>
          <Button
            onClick={() => {
              /* TODO: transactionModal.open(null) */
            }}
          >
            {t('add')}
          </Button>
          <Button
            variant="default"
            onClick={() => {
              /* TODO: importModal.open() */
            }}
          >
            {t('import')}
          </Button>
        </Group>
        <TextInput
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
      </Group>

      <Group>
        <Checkbox
          label={t('upcomingSubscriptions')}
          checked={showUpcoming}
          onChange={(e) => setShowUpcoming(e.currentTarget.checked)}
        />
        <Checkbox
          label={t('groupBySubcategories')}
          checked={groupBySubcategories}
          onChange={(e) => setGroupBySubcategories(e.currentTarget.checked)}
        />
      </Group>
      {/* 
          // we need to fetch all the orders from user settings
          // before we render the table, otherwise ordering won't work */}
      {userSettingsLoaded ? <TransactionTable items={items} /> : <Loader />}

      {/* TODO: modals render nothing for now */}
      <TransactionModal />
      <ImportModal />
    </Stack>
  );
}
