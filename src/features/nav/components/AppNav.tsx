import { NavLink, Stack } from '@mantine/core';
import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';

import { confirmUnsavedChanges } from '~/stores/sidebar/confirmUnsavedChanges';
import { sidebarFormRefAtom } from '~/stores/sidebar/sidebarStore';

import { type NavItem, navItems } from '../navItems';

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

  const renderItem = (item: NavItem) => {
    const Icon = item.icon;
    const hasChildren = Boolean(item.children && item.children.length > 0);
    const isActive = hasChildren
      ? pathname.startsWith(item.to)
      : pathname === item.to;

    if (hasChildren) {
      return (
        <NavLink
          key={item.to}
          label={t(item.labelKey)}
          leftSection={<Icon size={18} />}
          active={isActive}
          defaultOpened
          childrenOffset={28}
        >
          {item.children?.map(renderItem)}
        </NavLink>
      );
    }

    return (
      <NavLink
        key={item.to}
        component={Link}
        to={item.to}
        label={t(item.labelKey)}
        leftSection={<Icon size={18} />}
        active={isActive}
        onClick={(e: React.MouseEvent) => handleNavClick(e, item.to)}
      />
    );
  };

  return (
    <Stack gap={0} pt="sm">
      {navItems.map(renderItem)}
    </Stack>
  );
}
