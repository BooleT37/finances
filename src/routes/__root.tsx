import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import 'mantine-react-table/styles.css';
import 'dayjs/locale/ru';
import '~/lib/dayjs';

import { AppShell, createTheme, MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { useHydrateAtoms } from 'jotai/utils';
import { queryClientAtom } from 'jotai-tanstack-query';
import { I18nextProvider, useTranslation } from 'react-i18next';

import { AppHeader } from '~/features/nav/components/AppHeader';
import { AppNav } from '~/features/nav/components/AppNav';
import i18n from '~/lib/i18n';
import { trpc, trpcClient } from '~/lib/trpc/client';

const theme = createTheme({
  cursorType: 'pointer',
});
const queryClient = new QueryClient();

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    ],
    links: [{ rel: 'icon', href: '/favicon.ico' }],
  }),
  component: RootComponent,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  const { t, i18n: i18nInstance } = useTranslation('nav');
  return (
    <html lang={i18nInstance.language} data-mantine-color-scheme="light">
      <head>
        <HeadContent />
        <title>{t('appName')}</title>
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AppContent() {
  const { i18n: i18nInstance } = useTranslation();

  return (
    <DatesProvider settings={{ locale: i18nInstance.language }}>
      <Notifications />
      <AppShell
        header={{ height: 60 }}
        navbar={{ width: 200, breakpoint: 'sm' }}
        padding={{ base: 10, sm: 15, lg: 'md' }}
      >
        <AppShell.Header>
          <AppHeader />
        </AppShell.Header>
        <AppShell.Navbar>
          <AppNav />
        </AppShell.Navbar>
        <AppShell.Main>
          <Outlet />
        </AppShell.Main>
      </AppShell>
      <TanStackRouterDevtools />
    </DatesProvider>
  );
}

function HydrateAtoms({ children }: { children: React.ReactNode }) {
  useHydrateAtoms([[queryClientAtom, queryClient]]);
  return <>{children}</>;
}

function RootComponent() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <HydrateAtoms>
          <RootDocument>
            <I18nextProvider i18n={i18n}>
              <MantineProvider defaultColorScheme="light" theme={theme}>
                <ModalsProvider>
                  <AppContent />
                </ModalsProvider>
              </MantineProvider>
            </I18nextProvider>
          </RootDocument>
        </HydrateAtoms>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
