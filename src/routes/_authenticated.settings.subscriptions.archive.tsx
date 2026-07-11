import { createFileRoute } from '@tanstack/react-router';

import { SubscriptionsArchivePage } from '~/features/subscriptions/components/SubscriptionsPage/SubscriptionsArchivePage';

export const Route = createFileRoute(
  '/_authenticated/settings/subscriptions/archive',
)({
  component: SubscriptionsArchivePage,
});
