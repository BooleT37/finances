import { createQueryKeys } from '@lukemorales/query-key-factory';
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import { completeOnboarding, fetchOnboardingStatus } from './api';
import type { CompleteOnboardingInput } from './schema';

const onboardingKeys = createQueryKeys('onboarding', {
  status: { queryKey: null },
});

export const getOnboardingStatusQueryOptions = () =>
  queryOptions({
    ...onboardingKeys.status,
    queryFn: () => fetchOnboardingStatus(),
  });

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CompleteOnboardingInput) =>
      completeOnboarding({ data: input }),
    onSuccess: () =>
      queryClient.invalidateQueries(getOnboardingStatusQueryOptions()),
  });
}
