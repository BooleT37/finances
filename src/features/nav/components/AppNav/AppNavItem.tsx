import { NavLink, Tooltip } from '@mantine/core';
import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';

import { confirmUnsavedChanges } from '~/stores/sidebar/confirmUnsavedChanges';
import { sidebarFormRefAtom } from '~/stores/sidebar/sidebarStore';

import { navCollapsedAtom } from '../../navCollapsed.atom';
import { type NavItem } from '../../navItems';

interface AppNavItemProps {
  item: NavItem;
  depth?: number;
}

export function AppNavItem({ item, depth = 0 }: AppNavItemProps) {
  const collapsed = useAtomValue(navCollapsedAtom);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useTranslation('nav');
  const navigate = useNavigate();
  const formRef = useAtomValue(sidebarFormRefAtom);

  const Icon = item.icon;
  const hasChildren = Boolean(item.children?.length);
  const isActive = hasChildren
    ? pathname.startsWith(item.to)
    : pathname === item.to;

  // paddingLeft positions the icon via CSS transition:
  // collapsed — centers icon in 60px nav (top-level) or right-of-center (child)
  // expanded  — matches Mantine NavLink defaults (12px root, 40px child)
  const paddingLeft = collapsed
    ? depth === 0
      ? 21
      : 25
    : depth === 0
      ? 12
      : 40;

  const handleNavClick = (e: React.MouseEvent, to: string) => {
    if (!formRef?.isDirty()) {
      return;
    }
    e.preventDefault();
    confirmUnsavedChanges(() => void navigate({ to }));
  };

  // Always wrap icon in Tooltip — disabled in expanded mode so the DOM
  // structure is stable and the icon never jumps position on toggle.
  const leftSection = (
    <Tooltip
      label={t(item.labelKey)}
      position="right"
      withArrow
      disabled={!collapsed}
    >
      <span style={{ display: 'flex', alignItems: 'center' }}>
        <Icon size={18} />
      </span>
    </Tooltip>
  );

  const itemStyle: React.CSSProperties = {
    paddingLeft,
    transition: 'padding-left 0.25s ease',
  };

  const labelStyles = {
    label: {
      overflow: 'hidden',
      maxWidth: collapsed ? 0 : 150,
      opacity: collapsed ? 0 : 1,
      whiteSpace: 'nowrap' as const,
      transition: 'max-width 0.25s ease, opacity 0.15s ease',
    },
  };

  if (hasChildren) {
    return (
      <Fragment>
        <NavLink
          label={t(item.labelKey)}
          leftSection={leftSection}
          active={isActive}
          style={{ ...itemStyle, cursor: 'default' }}
          styles={labelStyles}
        />
        {item.children?.map((child) => (
          <AppNavItem key={child.to} item={child} depth={depth + 1} />
        ))}
      </Fragment>
    );
  }

  return (
    <NavLink
      component={Link}
      to={item.to}
      label={t(item.labelKey)}
      leftSection={leftSection}
      active={isActive}
      style={itemStyle}
      styles={labelStyles}
      onClick={(e: React.MouseEvent) => handleNavClick(e, item.to)}
    />
  );
}
