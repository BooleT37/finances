import { Box, Stack } from '@mantine/core';
import { useAtom } from 'jotai';

import { useIsAdmin } from '~/shared/hooks/useIsAdmin';

import { navCollapsedAtom } from '../../navCollapsed.atom';
import { AppNavItem } from './AppNavItem';
import { NavCollapseToggle } from './NavCollapseToggle';
import { filterNavItems, navItems } from './navItems';

export function AppNav() {
  const [collapsed, setCollapsed] = useAtom(navCollapsedAtom);
  const isAdmin = useIsAdmin();
  const visibleNavItems = filterNavItems(navItems, isAdmin);

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
