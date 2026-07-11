import { createFileRoute } from '@tanstack/react-router';

import { SourcesPage } from '~/features/sources/components/SourcesPage/SourcesPage';

export const Route = createFileRoute('/_authenticated/settings/sources')({
  component: SourcesPage,
});
