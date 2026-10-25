import { Anchor, Container, Stack, Text, Title } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import dayjs from 'dayjs';
import type { ReactNode } from 'react';

import { DATE_FORMAT } from '~/shared/constants';

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

export function LegalPage({ title, lastUpdated, children }: LegalPageProps) {
  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Stack gap={4}>
          <Title order={1}>{title}</Title>
          <Text size="sm" c="dimmed">
            Last updated: {dayjs(lastUpdated).format(DATE_FORMAT)}
          </Text>
        </Stack>
        {children}
        <Anchor component={Link} to="/login">
          Back to sign in
        </Anchor>
      </Stack>
    </Container>
  );
}

interface LegalSectionProps {
  heading: string;
  children: ReactNode;
}

export function LegalSection({ heading, children }: LegalSectionProps) {
  return (
    <Stack gap="xs">
      <Title order={2} size="h4">
        {heading}
      </Title>
      {children}
    </Stack>
  );
}

const CONTACT_EMAIL = 'aide.service.37@gmail.com';

export function LegalContactEmail() {
  return <Anchor href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Anchor>;
}
