import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { BankCallbackPage } from '~/features/import/components/BankCallbackPage/BankCallbackPage';

const bankCallbackSearchSchema = z.object({
  code: z.string().optional(),
  state: z.string().optional(),
  error: z.string().optional(),
});

export const Route = createFileRoute(
  '/_authenticated/settings/sources_/bank-callback',
)({
  validateSearch: bankCallbackSearchSchema,
  component: BankCallbackRoute,
});

function BankCallbackRoute() {
  const { code, state, error } = Route.useSearch();
  return <BankCallbackPage code={code} state={state} error={error} />;
}
