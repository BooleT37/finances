import { MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { ModalsProvider } from '@mantine/modals';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  render,
  renderHook,
  type RenderHookOptions,
  type RenderOptions,
} from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';
import React from 'react';
import { I18nextProvider } from 'react-i18next';

import i18n from '~/lib/i18n';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Don't retry on failure in tests — fail fast
        retry: false,
        // Disable garbage collection so query data stays available for assertions
        gcTime: Infinity,
        staleTime: Infinity,
      },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <JotaiProvider>
        <QueryClientProvider client={queryClient}>
          <I18nextProvider i18n={i18n}>
            <MantineProvider>
              <ModalsProvider>
                <DatesProvider settings={{ locale: 'ru' }}>
                  {children}
                </DatesProvider>
              </ModalsProvider>
            </MantineProvider>
          </I18nextProvider>
        </QueryClientProvider>
      </JotaiProvider>
    );
  };
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Pass a pre-configured QueryClient to inspect its state after render. */
  queryClient?: QueryClient;
}

function customRender(
  ui: React.ReactElement,
  { queryClient, ...options }: CustomRenderOptions = {},
) {
  const client = queryClient ?? makeQueryClient();
  return render(ui, { wrapper: createWrapper(client), ...options });
}

interface CustomRenderHookOptions<TProps> extends Omit<
  RenderHookOptions<TProps>,
  'wrapper'
> {
  queryClient?: QueryClient;
}

function customRenderHook<TResult, TProps>(
  hook: (props: TProps) => TResult,
  { queryClient, ...options }: CustomRenderHookOptions<TProps> = {},
) {
  const client = queryClient ?? makeQueryClient();
  return renderHook(hook, { wrapper: createWrapper(client), ...options });
}

export * from '@testing-library/react';
export {
  makeQueryClient,
  customRender as render,
  customRenderHook as renderHook,
};
