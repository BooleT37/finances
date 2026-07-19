import {
  ActionIcon,
  Box,
  Button,
  Checkbox,
  Group,
  Stack,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { IconFileImport, IconPlus, IconSearch } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useMolecule } from 'bunshi/react';
import { useAtom, useSetAtom } from 'jotai';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FeatureOnboardingTour } from '~/features/onboarding/components/FeatureOnboardingTour';
import { getUserSettingsQueryOptions } from '~/features/userSettings/queries';

import { useTransactionsOnboardingSteps } from '../../onboarding/useTransactionsOnboardingSteps';
import { ImportModal, importModalOpenAtom } from '../ImportModal';
import { TransactionSidebar } from '../TransactionSidebar/TransactionSidebar';
import { TransactionSidebarMolecule } from '../TransactionSidebar/transactionSidebarMolecule';
import { TransactionTable } from '../TransactionsTable/TransactionsTable';
import {
  groupBySubcategoriesAtom,
  transactionSearchAtom,
} from './TransactionsPage.atoms';
import { TransactionsTableSkeleton } from './TransactionsTableSkeleton';
import { UpcomingSubscriptionsBadge } from './UpcomingSubscriptionsBadge';
import { useTransactionTableItems } from './useTransactionTableItems';

const sidebarWidth = 300;

export function TransactionsPage() {
  const { t } = useTranslation('transactions');
  const { openAtom, closeAtom } = useMolecule(TransactionSidebarMolecule);
  const openSidebar = useSetAtom(openAtom);
  const closeSidebar = useSetAtom(closeAtom);
  const setImportOpen = useSetAtom(importModalOpenAtom);
  const onboardingSteps = useTransactionsOnboardingSteps();

  // Open the sidebar as soon as the intro step (not just the "from savings"
  // step) becomes active, so the type field it targets is already mounted by
  // the time the tour advances to it — opening it only on that later step
  // raced against the mount and could leave the whole sidebar focused instead
  // of the specific control.
  const handleOnboardingStepChange = useCallback(() => {
    openSidebar(null);
  }, [openSidebar]);
  const [search, setSearch] = useAtom(transactionSearchAtom);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [groupBySubcategories, setGroupBySubcategories] = useAtom(
    groupBySubcategoriesAtom,
  );

  const items = useTransactionTableItems({
    showUpcoming,
    searchString: search,
  });
  const { isSuccess: userSettingsLoaded } = useQuery(
    getUserSettingsQueryOptions(),
  );

  return (
    <FeatureOnboardingTour
      featureKey="transactions"
      steps={onboardingSteps}
      onStepChange={handleOnboardingStepChange}
      onEnd={closeSidebar}
    >
      <Stack
        h="100%"
        style={{ flex: 1, marginRight: sidebarWidth, minWidth: 910 }}
      >
        <Group justify="space-between">
          <Group gap="sm">
            <TextInput
              leftSection={<IconSearch size={16} />}
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => {
                setSearch(e.currentTarget.value);
              }}
            />
            <Checkbox
              label={t('groupBySubcategories')}
              checked={groupBySubcategories}
              onChange={(e) => setGroupBySubcategories(e.currentTarget.checked)}
            />
            <UpcomingSubscriptionsBadge
              showUpcoming={showUpcoming}
              onToggle={() => setShowUpcoming((prev) => !prev)}
            />
          </Group>
          <Group gap="sm">
            <Tooltip label={t('import')}>
              <ActionIcon
                variant="default"
                size="lg"
                onClick={() => setImportOpen(true)}
              >
                <IconFileImport size={16} />
              </ActionIcon>
            </Tooltip>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => openSidebar(null)}
            >
              {t('add')}
            </Button>
          </Group>
        </Group>
        {/*
          // we need to fetch all the orders from user settings
          // before we render the table, otherwise ordering won't work */}
        <Box
          data-onboarding-tour-id="transactions-intro"
          style={{ flex: 1, minHeight: 0 }}
        >
          {userSettingsLoaded ? (
            <TransactionTable
              items={items}
              groupBySubcategories={groupBySubcategories}
            />
          ) : (
            <TransactionsTableSkeleton />
          )}
        </Box>

        <TransactionSidebar width={sidebarWidth} />
        <ImportModal />
      </Stack>
    </FeatureOnboardingTour>
  );
}
