import { Divider, Stack, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { ChangePasswordForm } from '~/features/auth/components/ChangePasswordForm';

import { NameForm } from './NameForm';

export function AccountSettingsPage() {
  const { t } = useTranslation('account');

  return (
    <Stack gap="xl" maw={400}>
      <Title order={3}>{t('pageTitle')}</Title>

      <Stack gap="md">
        <Title order={5}>{t('sections.name')}</Title>
        <NameForm />
      </Stack>

      <Divider />

      <Stack gap="md">
        <Title order={5}>{t('sections.password')}</Title>
        <ChangePasswordForm />
      </Stack>
    </Stack>
  );
}
