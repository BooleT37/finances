import { Breadcrumbs, Group, Text } from '@mantine/core';
import { useRouterState } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { LanguageSwitcher } from '~/components/LanguageSwitcher';
import { MonthNavigator } from '~/features/nav/components/MonthNavigator';

import { findBreadcrumbTrail } from '../navItems';

export function AppHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useTranslation('nav');

  const showNavigator =
    pathname === '/transactions' || pathname === '/budgeting';

  const trail = findBreadcrumbTrail(pathname);

  return (
    <Group h="100%" px="md" justify="space-between" align="center">
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

      {showNavigator && <MonthNavigator />}

      <LanguageSwitcher />
    </Group>
  );
}
