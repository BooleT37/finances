import { MantineProvider, createTheme, Group, Box } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import {
  Outlet,
  HeadContent,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { I18nextProvider } from 'react-i18next'
import { LanguageSwitcher } from '~/components/LanguageSwitcher'
import i18n from '~/i18n'
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/notifications/styles.css'

const theme = createTheme({})

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Finances' },
    ],
  }),
  component: RootComponent,
})

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
  )
}

function RootComponent() {
  return (
    <RootDocument>
      <I18nextProvider i18n={i18n}>
        <MantineProvider theme={theme}>
          <Notifications />
          <Box p="sm">
            <Group justify="flex-end">
              <LanguageSwitcher />
            </Group>
          </Box>
          <Outlet />
          <TanStackRouterDevtools />
        </MantineProvider>
      </I18nextProvider>
    </RootDocument>
  )
}
