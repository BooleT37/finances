import { notifications } from '@mantine/notifications';
import { useQuery } from '@tanstack/react-query';
import { useRouteContext } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { EditableTitle } from '~/shared/components/EditableTitle';

import { getProjectQueryOptions, useRenameProject } from '../queries';
import type { ProjectInfo } from '../schema';

export function ProjectInfoPage() {
  const { data: project } = useQuery(getProjectQueryOptions());
  return project ? <ProjectTitle project={project} /> : null;
}

interface ProjectTitleProps {
  project: ProjectInfo;
}

function ProjectTitle({ project }: ProjectTitleProps) {
  const { t } = useTranslation('project');
  const { session } = useRouteContext({ from: '/_authenticated' });
  const isAdmin = session.role === 'admin';
  const renameMutation = useRenameProject();

  async function handleSave(newName: string) {
    try {
      await renameMutation.mutateAsync({ name: newName });
      notifications.show({
        color: 'green',
        message: t('notifications.renamed'),
      });
    } catch (error) {
      notifications.show({
        color: 'red',
        message: t('notifications.renameError'),
      });
      throw error;
    }
  }

  return (
    <EditableTitle
      prefix={`${t('pageTitle')} `}
      value={project.name}
      editable={isAdmin}
      editLabel={t('actions.rename')}
      onSave={handleSave}
    />
  );
}
