import { createFileRoute } from '@tanstack/react-router'
import { Container, Title, Text, Stack } from '@mantine/core'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/')(({
  component: Home,
}))

function Home() {
  const { t } = useTranslation('home')
  return (
    <Container size="sm" py="xl">
      <Stack>
        <Title order={1}>{t('title')}</Title>
        <Text c="dimmed">{t('subtitle')}</Text>
      </Stack>
    </Container>
  )
}
