import { AppShell, Group, Text } from '@mantine/core';
import { useRouterState } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { LanguageSwitcher } from '~/components/LanguageSwitcher';
import { MonthNavigator } from '~/components/MonthNavigator';

export function AppHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useTranslation('nav');

  const showNavigator =
    pathname === '/transactions' || pathname === '/planning';
  const showYearToggle = pathname === '/transactions';

  return (
    <AppShell.Header>
      <Group h="100%" px="md" justify="space-between" align="center">
        <Text fw={700} size="lg">
          {t('appName')}
        </Text>

        {showNavigator && <MonthNavigator showYearToggle={showYearToggle} />}

        <LanguageSwitcher />
      </Group>
    </AppShell.Header>
  );
}
