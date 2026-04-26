import { createFileRoute } from '@tanstack/react-router';

import { SubscriptionsArchivePage } from '~/features/subscriptions/components/SubscriptionsPage/SubscriptionsArchivePage';

export const Route = createFileRoute('/settings/subscriptions/archive')({
  component: SubscriptionsArchivePage,
});
