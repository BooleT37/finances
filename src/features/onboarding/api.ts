import { createServerFn } from '@tanstack/react-start';

import { authMiddleware } from '~/middlewares/authMiddleware';
import { prisma } from '~/server/db';

import {
  type CompleteOnboardingInput,
  completeOnboardingSchema,
  type OnboardingStatus,
} from './schema';

export const fetchOnboardingStatus = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<OnboardingStatus> => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: context.userId },
      select: { onboardingCompletedAt: true },
    });
    return { completed: user.onboardingCompletedAt !== null };
  });

export const completeOnboarding = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((input: CompleteOnboardingInput) =>
    completeOnboardingSchema.parse(input),
  )
  .handler(async ({ context }): Promise<OnboardingStatus> => {
    await prisma.user.update({
      where: { id: context.userId },
      data: { onboardingCompletedAt: new Date() },
    });
    return { completed: true };
  });
