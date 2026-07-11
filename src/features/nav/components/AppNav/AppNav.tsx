import { Box, Stack } from '@mantine/core';
import { useRouteContext } from '@tanstack/react-router';
import { useAtom } from 'jotai';

import { navCollapsedAtom } from '../../navCollapsed.atom';
import { AppNavItem } from './AppNavItem';
import { NavCollapseToggle } from './NavCollapseToggle';
import { filterNavItems, navItems } from './navItems';

export function AppNav() {
  const [collapsed, setCollapsed] = useAtom(navCollapsedAtom);
  const { session } = useRouteContext({ from: '/_authenticated' });
  const visibleNavItems = filterNavItems(navItems, session.role === 'admin');

  return (
    <Stack gap={0} pt="sm" h="100%">
      <Box flex={1} style={{ overflow: 'hidden' }}>
        {visibleNavItems.map((item) => (
          <AppNavItem key={item.to} item={item} />
        ))}
      </Box>
      <NavCollapseToggle
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />
    </Stack>
  );
}
