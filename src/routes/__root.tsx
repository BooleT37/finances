import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';

import { AppShell, createTheme, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { I18nextProvider } from 'react-i18next';

import { AppHeader } from '~/components/AppHeader';
import { AppNav } from '~/components/AppNav';
import i18n from '~/i18n';

const theme = createTheme({});

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Finances' },
    ],
  }),
  component: RootComponent,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <RootDocument>
      <I18nextProvider i18n={i18n}>
        <MantineProvider theme={theme}>
          <Notifications />
          <AppShell
            header={{ height: 80 }}
            navbar={{ width: 200, breakpoint: 'sm' }}
          >
            <AppHeader />
            <AppShell.Navbar>
              <AppNav />
            </AppShell.Navbar>
            <AppShell.Main>
              <Outlet />
            </AppShell.Main>
          </AppShell>
          <TanStackRouterDevtools />
        </MantineProvider>
      </I18nextProvider>
    </RootDocument>
  );
}
