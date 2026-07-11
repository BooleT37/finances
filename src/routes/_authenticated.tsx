import { AppShell } from '@mantine/core';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';

import { fetchSession } from '~/features/auth/api';
import { AppHeader } from '~/features/nav/components/AppHeader';
import { AppNav } from '~/features/nav/components/AppNav/AppNav';
import { navCollapsedAtom } from '~/features/nav/navCollapsed.atom';

const NAV_WIDTH_EXPANDED = 200;
const NAV_WIDTH_COLLAPSED = 60;

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    const session = await fetchSession();
    if (!session) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      });
    }
    return { session };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navCollapsed = useAtomValue(navCollapsedAtom);

  return (
    <AppShell
      header={{ height: 40 }}
      navbar={{
        width: navCollapsed ? NAV_WIDTH_COLLAPSED : NAV_WIDTH_EXPANDED,
        breakpoint: 'xs',
      }}
      padding={{ base: 10, sm: 15, lg: 'md' }}
    >
      <AppShell.Header>
        <AppHeader />
      </AppShell.Header>
      <AppShell.Navbar style={{ transition: 'width 0.25s ease' }}>
        <AppNav />
      </AppShell.Navbar>
      <AppShell.Main style={{ transition: 'padding-left 0.25s ease' }}>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
