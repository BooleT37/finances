import { ActionIcon, Breadcrumbs, Group, Text, Tooltip } from '@mantine/core';
import { IconLogout } from '@tabler/icons-react';
import {
  useNavigate,
  useRouteContext,
  useRouterState,
} from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { LanguageSwitcher } from '~/components/LanguageSwitcher';
import { MonthNavigator } from '~/features/nav/components/MonthNavigator';
import { OnboardingHelpButton } from '~/features/onboarding/components/OnboardingHelpButton';
import { authClient } from '~/lib/auth/client';

import { findBreadcrumbTrail } from './AppNav/navItems';

export function AppHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useTranslation('nav');
  const navigate = useNavigate();
  const { session, queryClient } = useRouteContext({ from: '/_authenticated' });

  const showNavigator =
    pathname === '/transactions' || pathname === '/budgeting';

  const trail = findBreadcrumbTrail(pathname);

  async function handleSignOut() {
    await authClient.signOut();
    // Query keys aren't scoped by project, so cached data from this session
    // would otherwise survive into the next user's session if they sign in
    // in the same tab without a full page reload.
    queryClient.clear();
    void navigate({ to: '/login' });
  }

  return (
    <Group h="100%" px="md" justify="space-between" align="center">
      <Group gap="xs" align="center">
        <Breadcrumbs separator="/">
          <Text key="app" fw={700} size="sm">
            {t('appName')}
          </Text>
          {trail.map((item) => (
            <Text key={item.to} fw={500} size="sm">
              {t(item.labelKey)}
            </Text>
          ))}
        </Breadcrumbs>
        <OnboardingHelpButton />
      </Group>

      {showNavigator && <MonthNavigator />}

      <Group gap="sm">
        <Text size="sm" c="dimmed">
          {session.email}
        </Text>
        <LanguageSwitcher />
        <Tooltip label={t('signOut')}>
          <ActionIcon
            variant="subtle"
            aria-label={t('signOut')}
            onClick={handleSignOut}
          >
            <IconLogout size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Group>
  );
}
