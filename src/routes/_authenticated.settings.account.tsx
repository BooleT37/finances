import { createFileRoute } from '@tanstack/react-router';

import { AccountSettingsPage } from '~/features/account/components/AccountSettingsPage';

export const Route = createFileRoute('/_authenticated/settings/account')({
  component: AccountSettingsPage,
});
