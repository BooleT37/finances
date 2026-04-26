import { Button, Stack } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { Link } from '@tanstack/react-router';
import { useMolecule } from 'bunshi/react';
import { useTranslation } from 'react-i18next';

import { SubscriptionSidebarMolecule } from '~/features/subscriptions/components/SubscriptionSidebar/subscriptionSidebarMolecule';

import { SubscriptionSidebar } from '../SubscriptionSidebar/SubscriptionSidebar';
import { SubscriptionsTable } from '../SubscriptionsTable/SubscriptionsTable';

const SIDEBAR_WIDTH = 380;

export function SubscriptionsArchivePage() {
  const { t } = useTranslation('subscriptions');
  useMolecule(SubscriptionSidebarMolecule);

  return (
    <Stack gap="md" style={{ paddingRight: SIDEBAR_WIDTH }}>
      <Button
        variant="default"
        leftSection={<IconArrowLeft size={16} />}
        component={Link}
        to="/settings/subscriptions"
        style={{ alignSelf: 'flex-start' }}
      >
        {t('back')}
      </Button>
      <SubscriptionsTable mode="archived" />
      <SubscriptionSidebar />
    </Stack>
  );
}
