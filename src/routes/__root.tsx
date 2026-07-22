import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import 'mantine-react-table-open/styles.css';
import '@gfazioli/mantine-onboarding-tour/styles.css';
import 'dayjs/locale/ru';
import '~/lib/dayjs';

import { Code, createTheme, MantineProvider, Text, Title } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import type { createStore } from 'jotai';
import { Provider as JotaiProvider } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { queryClientAtom } from 'jotai-tanstack-query';
import { useLayoutEffect } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';

import i18n, { isSupportedLanguage, LANGUAGE_STORAGE_KEY } from '~/lib/i18n';
import { trpc, trpcClient } from '~/lib/trpc/client';

const theme = createTheme({
  cursorType: 'pointer',
});

interface RouterContext {
  queryClient: QueryClient;
  jotaiStore: ReturnType<typeof createStore>;
}

function RootErrorComponent({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  return (
    <RootDocument>
      <I18nextProvider i18n={i18n}>
        <MantineProvider defaultColorScheme="light" theme={theme}>
          <div style={{ padding: '2rem' }}>
            <Title order={3} c="red" mb="xs">
              Something went wrong
            </Title>
            <Text mb="xs">{message}</Text>
            {stack && (
              <Code block style={{ whiteSpace: 'pre-wrap' }}>
                {stack}
              </Code>
            )}
          </div>
        </MantineProvider>
      </I18nextProvider>
    </RootDocument>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    ],
    links: [{ rel: 'icon', href: '/favicon.ico' }],
  }),
  component: RootComponent,
  errorComponent: RootErrorComponent,
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
      <Outlet />
      <TanStackRouterDevtools position="bottom-right" />
    </DatesProvider>
  );
}

function HydrateAtoms({
  queryClient,
  children,
}: {
  queryClient: QueryClient;
  children: React.ReactNode;
}) {
  useHydrateAtoms([[queryClientAtom, queryClient]]);
  return <>{children}</>;
}

function RootComponent() {
  const { queryClient, jotaiStore } = Route.useRouteContext();

  // SSR (and therefore the client's first render) always uses the default
  // language, since neither localStorage nor navigator.language exist
  // server-side. useLayoutEffect (not useEffect) applies the right language
  // synchronously right after hydration commits, before the browser paints
  // — so the user never sees a flash of the default language, even though
  // the saved/detected language can differ from what was server-rendered.
  useLayoutEffect(() => {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage && isSupportedLanguage(savedLanguage)) {
      if (savedLanguage !== i18n.language) {
        void i18n.changeLanguage(savedLanguage);
      }
      return;
    }
    // No saved preference yet — prefill from the browser's language,
    // defaulting to the app's default (Russian) for anything unsupported.
    const browserLanguage = navigator.language.split('-')[0];
    const initialLanguage = isSupportedLanguage(browserLanguage)
      ? browserLanguage
      : 'ru';
    if (initialLanguage !== i18n.language) {
      void i18n.changeLanguage(initialLanguage);
    }
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <JotaiProvider store={jotaiStore}>
          <HydrateAtoms queryClient={queryClient}>
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
        </JotaiProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
