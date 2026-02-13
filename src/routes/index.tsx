import { createFileRoute } from '@tanstack/react-router'
import { Container, Title, Text, Stack } from '@mantine/core'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <Container size="sm" py="xl">
      <Stack>
        <Title order={1}>Finances</Title>
        <Text c="dimmed">
          Personal finances tool — logging, budgeting, tracking, and statistics.
        </Text>
      </Stack>
    </Container>
  )
}
