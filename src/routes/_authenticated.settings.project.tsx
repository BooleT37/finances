import { Divider, Stack } from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';

import { ProjectInfoPage } from '~/features/project/components/ProjectInfoPage';
import { CategorySuggestionsSwitch } from '~/features/projectSettings/components/CategorySuggestionsSwitch';
import { ProjectUsersTable } from '~/features/projectUsers/components/ProjectUsersTable/ProjectUsersTable';

export const Route = createFileRoute('/_authenticated/settings/project')({
  component: ProjectPage,
});

function ProjectPage() {
  return (
    <Stack gap="xl">
      <ProjectInfoPage />
      <Divider />
      <ProjectUsersTable />
      <Divider />
      <CategorySuggestionsSwitch />
    </Stack>
  );
}
