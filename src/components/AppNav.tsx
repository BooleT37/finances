import { NavLink, Stack } from '@mantine/core';
import { Link, useRouterState } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export function AppNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useTranslation('nav');

  const items = [
    { to: '/transactions', label: t('transactions') },
    { to: '/planning', label: t('planning') },
    { to: '/savings-spendings', label: t('savings') },
    { to: '/statistics', label: t('statistics') },
  ];

  return (
    <Stack gap={0} pt="sm">
      {items.map((item) => (
        <NavLink
          key={item.to}
          component={Link}
          to={item.to}
          label={item.label}
          active={pathname === item.to}
        />
      ))}
    </Stack>
  );
}
