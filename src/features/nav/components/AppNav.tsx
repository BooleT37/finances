import { NavLink, Stack } from '@mantine/core';
import {
  IconBuildingBank,
  IconCalendar,
  IconChartLine,
  IconSettings,
  IconTable,
  IconTag,
} from '@tabler/icons-react';
import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';

import { confirmUnsavedChanges } from '~/stores/sidebar/confirmUnsavedChanges';
import { sidebarFormRefAtom } from '~/stores/sidebar/sidebarStore';

export function AppNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useTranslation('nav');
  const navigate = useNavigate();
  const formRef = useAtomValue(sidebarFormRefAtom);

  const handleNavClick = (e: React.MouseEvent, to: string) => {
    if (!formRef?.isDirty()) {
      return;
    }
    e.preventDefault();
    confirmUnsavedChanges(() => void navigate({ to }));
  };

  const items = [
    {
      to: '/transactions',
      label: t('transactions'),
      icon: <IconTable size={18} />,
    },
    {
      to: '/budgeting',
      label: t('planning'),
      icon: <IconCalendar size={18} />,
    },
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
          onClick={(e: React.MouseEvent) => handleNavClick(e, item.to)}
        />
      ))}
      <NavLink
        label={t('settings')}
        leftSection={<IconSettings size={18} />}
        active={pathname.startsWith('/settings')}
        defaultOpened
        childrenOffset={28}
      >
        <NavLink
          component={Link}
          to="/settings/categories"
          label={t('categories')}
          leftSection={<IconTag size={18} />}
          active={pathname === '/settings/categories'}
          onClick={(e: React.MouseEvent) =>
            handleNavClick(e, '/settings/categories')
          }
        />
      </NavLink>
    </Stack>
  );
}
