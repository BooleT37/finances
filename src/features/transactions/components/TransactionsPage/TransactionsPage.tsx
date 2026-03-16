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
import { useMolecule } from 'bunshi/react';
import { useAtom, useSetAtom } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getUserSettingsQueryOptions } from '~/features/userSettings/queries';
import { transactionSearchAtom } from '~/stores/month';

import { ImportModal } from '../ImportModal';
import { TransactionSidebar } from '../TransactionSidebar/TransactionSidebar';
import { TransactionSidebarMolecule } from '../TransactionSidebar/transactionSidebarMolecule';
import { TransactionTable } from '../TransactionsTable/TransactionsTable';
import { useTransactionTableItems } from './useTransactionTableItems';

const sidebarWidth = 300;

export function TransactionsPage() {
  const { t } = useTranslation('transactions');
  const { openAtom } = useMolecule(TransactionSidebarMolecule);
  const openSidebar = useSetAtom(openAtom);
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
    <Stack h="100%" style={{ flex: 1, marginRight: sidebarWidth }}>
      <Group justify="space-between">
        <Group gap="sm">
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => openSidebar(null)}
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
            setSearch(e.currentTarget.value);
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

      <TransactionSidebar width={sidebarWidth} />
      <ImportModal />
    </Stack>
  );
}
