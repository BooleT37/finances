import { Divider, Stack } from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';

import { ProjectInfoPage } from '~/features/project/components/ProjectInfoPage';
import { ProjectUsersTable } from '~/features/projectUsers/components/ProjectUsersTable/ProjectUsersTable';

export const Route = createFileRoute('/_authenticated/settings/project')({
  component: ProjectPage,
});

function ProjectPage() {
  const { session } = Route.useRouteContext();

  return (
    <Stack gap="xl">
      <ProjectInfoPage />
      {session.role === 'admin' && (
        <>
          <Divider />
          <ProjectUsersTable />
        </>
      )}
    </Stack>
  );
}
