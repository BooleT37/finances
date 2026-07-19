import { z } from 'zod';

export interface OnboardingStatus {
  completed: boolean;
}

export const completeOnboardingSchema = z.object({
  reason: z.enum(['completed', 'skipped']),
});
export type CompleteOnboardingInput = z.input<typeof completeOnboardingSchema>;
