import { NavLink, Stack } from '@mantine/core';
import {
  IconBuildingBank,
  IconCalendar,
  IconChartLine,
  IconTable,
} from '@tabler/icons-react';
import { Link, useRouterState } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export function AppNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useTranslation('nav');

  const items = [
    {
      to: '/transactions',
      label: t('transactions'),
      icon: <IconTable size={18} />,
    },
    { to: '/planning', label: t('planning'), icon: <IconCalendar size={18} /> },
    {
      to: '/savings-spendings',
      label: t('savings'),
      icon: <IconBuildingBank size={18} />,
    },
    {
      to: '/statistics',
      label: t('statistics'),
      icon: <IconChartLine size={18} />,
    },
  ];

  return (
    <Stack gap={0} pt="sm">
      {items.map((item) => (
        <NavLink
          key={item.to}
          component={Link}
          to={item.to}
          label={item.label}
          leftSection={item.icon}
          active={pathname === item.to}
        />
      ))}
    </Stack>
  );
}
