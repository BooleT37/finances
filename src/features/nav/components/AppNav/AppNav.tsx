import { Box, Stack } from '@mantine/core';
import { useAtom } from 'jotai';

import { navCollapsedAtom } from '../../navCollapsed.atom';
import { navItems } from '../../navItems';
import { AppNavItem } from './AppNavItem';
import { NavCollapseToggle } from './NavCollapseToggle';

export function AppNav() {
  const [collapsed, setCollapsed] = useAtom(navCollapsedAtom);

  return (
    <Stack gap={0} pt="sm" h="100%">
      <Box flex={1} style={{ overflow: 'hidden' }}>
        {navItems.map((item) => (
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
