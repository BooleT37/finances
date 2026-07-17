import { createFileRoute } from '@tanstack/react-router';

import { ProjectInfoPage } from '~/features/project/components/ProjectInfoPage';

export const Route = createFileRoute('/_authenticated/settings/project')({
  component: ProjectInfoPage,
});
