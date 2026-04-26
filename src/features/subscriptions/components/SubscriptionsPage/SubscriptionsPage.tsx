import { Button, Group, Stack } from '@mantine/core';
import { IconArchive, IconPlus } from '@tabler/icons-react';
import { Link } from '@tanstack/react-router';
import { useMolecule } from 'bunshi/react';
import { useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { SubscriptionSidebarMolecule } from '~/features/subscriptions/components/SubscriptionSidebar/subscriptionSidebarMolecule';

import { SubscriptionSidebar } from '../SubscriptionSidebar/SubscriptionSidebar';
import { SubscriptionsTable } from '../SubscriptionsTable/SubscriptionsTable';

const SIDEBAR_WIDTH = 380;

export function SubscriptionsPage() {
  const { t } = useTranslation('subscriptions');
  const { openAtom } = useMolecule(SubscriptionSidebarMolecule);
  const open = useSetAtom(openAtom);

  return (
    <Stack gap="md" style={{ paddingRight: SIDEBAR_WIDTH }}>
      <Group>
        <Button leftSection={<IconPlus size={16} />} onClick={() => open(null)}>
          {t('addSubscription')}
        </Button>
        <Button
          variant="default"
          leftSection={<IconArchive size={16} />}
          component={Link}
          to="/settings/subscriptions/archive"
        >
          {t('archive')}
        </Button>
      </Group>
      <SubscriptionsTable mode="active" />
      <SubscriptionSidebar />
    </Stack>
  );
}
