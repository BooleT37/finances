import { Button, Stack } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { useCreateSource } from '~/features/sources/queries';

import { SourcesTable } from '../SourcesTable/SourcesTable';

export function SourcesPage() {
  const { t } = useTranslation('sources');
  const createSource = useCreateSource();

  return (
    <Stack gap="md">
      <Button
        leftSection={<IconPlus size={16} />}
        onClick={() => createSource.mutate({ name: t('newSourceName') })}
        loading={createSource.isPending}
        style={{ alignSelf: 'flex-start' }}
      >
        {t('addSource')}
      </Button>
      <SourcesTable />
    </Stack>
  );
}
