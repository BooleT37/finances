import { createFileRoute } from '@tanstack/react-router';

import { SubscriptionsPage } from '~/features/subscriptions/components/SubscriptionsPage/SubscriptionsPage';

export const Route = createFileRoute('/settings/subscriptions')({
  component: SubscriptionsPage,
});
