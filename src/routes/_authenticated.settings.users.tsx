import { createFileRoute, redirect } from '@tanstack/react-router';

import { ProjectUsersTable } from '~/features/projectUsers/components/ProjectUsersTable';

export const Route = createFileRoute('/_authenticated/settings/users')({
  beforeLoad: ({ context }) => {
    if (context.session.role !== 'admin') {
      throw redirect({ to: '/settings/categories' });
    }
  },
  component: ProjectUsersTable,
});
