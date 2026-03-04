import {
  ActionIcon,
  Button,
  Checkbox,
  Group,
  Loader,
  Stack,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { IconFileImport, IconPlus, IconSearch } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useAtom, useSetAtom } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getUserSettingsQueryOptions } from '~/features/userSettings/queries';
import { transactionSearchAtom, viewModeAtom } from '~/stores/month';

import { useTransactionTableItems } from '../useTransactionTableItems';
import { ImportModal } from './ImportModal';
import { TransactionModal } from './TransactionModal';
import { TransactionTable } from './TransactionTable';

export function TransactionsPage() {
  const { t } = useTranslation('transactions');
  const setViewMode = useSetAtom(viewModeAtom);
  const [search, setSearch] = useAtom(transactionSearchAtom);
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
        <Group gap="sm">
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => {
              /* TODO: transactionModal.open(null) */
            }}
            disabled
          >
            {t('add')}
          </Button>
          <Tooltip label={t('import')}>
            <ActionIcon
              disabled
              variant="default"
              size="lg"
              onClick={() => {
                /* TODO: importModal.open() */
              }}
            >
              <IconFileImport size={16} />
            </ActionIcon>
          </Tooltip>
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
        <TextInput
          leftSection={<IconSearch size={16} />}
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => {
            const value = e.currentTarget.value;
            if (value && !search) {
              setViewMode('year');
            }
            setSearch(value);
          }}
        />
      </Group>
      {/* 
          // we need to fetch all the orders from user settings
          // before we render the table, otherwise ordering won't work */}
      {userSettingsLoaded ? (
        <TransactionTable
          items={items}
          groupBySubcategories={groupBySubcategories}
        />
      ) : (
        <Loader />
      )}

      {/* TODO: modals render nothing for now */}
      <TransactionModal />
      <ImportModal />
    </Stack>
  );
}
