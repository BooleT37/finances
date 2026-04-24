import { Stack, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { SourcesTable } from '../SourcesTable/SourcesTable';

export function SourcesPage() {
  const { t } = useTranslation('sources');
  return (
    <Stack gap="md">
      <Title order={3}>{t('pageTitle')}</Title>
      <SourcesTable />
    </Stack>
  );
}
