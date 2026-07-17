import { Button, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQuery } from '@tanstack/react-query';
import { useRouteContext } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getProjectQueryOptions, useRenameProject } from '../queries';
import type { ProjectInfo } from '../schema';

export function ProjectInfoPage() {
  const { t } = useTranslation('project');
  const { data: project } = useQuery(getProjectQueryOptions());

  return (
    <Stack gap="md" maw={400}>
      <Title order={3}>{t('pageTitle')}</Title>
      {project && <ProjectNameSection project={project} />}
    </Stack>
  );
}

interface ProjectNameSectionProps {
  project: ProjectInfo;
}

function ProjectNameSection({ project }: ProjectNameSectionProps) {
  const { t } = useTranslation('project');
  const { session } = useRouteContext({ from: '/_authenticated' });
  const isAdmin = session.role === 'admin';
  const renameMutation = useRenameProject();
  const [name, setName] = useState(project.name);

  function handleSave() {
    if (!name.trim()) {
      return;
    }
    renameMutation.mutate(
      { name },
      {
        onSuccess: () =>
          notifications.show({
            color: 'green',
            message: t('notifications.renamed'),
          }),
        onError: () =>
          notifications.show({
            color: 'red',
            message: t('notifications.renameError'),
          }),
      },
    );
  }

  if (!isAdmin) {
    return (
      <Stack gap={4}>
        <Text size="sm" fw={500}>
          {t('form.name')}
        </Text>
        <Text>{project.name}</Text>
      </Stack>
    );
  }

  const isDirty = name.trim() !== project.name;

  return (
    <Group align="flex-end">
      <TextInput
        label={t('form.name')}
        value={name}
        onChange={(e) => setName(e.currentTarget.value)}
        style={{ flex: 1 }}
      />
      <Button
        onClick={handleSave}
        loading={renameMutation.isPending}
        disabled={!isDirty}
      >
        {t('form.save')}
      </Button>
    </Group>
  );
}
