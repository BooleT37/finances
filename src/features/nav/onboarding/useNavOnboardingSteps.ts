import type { OnboardingTourStep } from '@gfazioli/mantine-onboarding-tour';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Route each settings-menu step navigates to when it becomes active, so the
 * highlighted nav item and the visible page stay in sync. The `onboarding-settings`
 * (welcome) step has no entry — `/settings` has no page of its own, and the
 * welcome message belongs on the landing screen.
 */
export const navOnboardingStepRoutes: Record<string, string> = {
  'onboarding-categories': '/settings/categories',
  'onboarding-sources': '/settings/sources',
  'onboarding-subscriptions': '/settings/subscriptions',
};

export function useNavOnboardingSteps(): OnboardingTourStep[] {
  const { t } = useTranslation('nav');

  return useMemo(
    () => [
      {
        id: 'onboarding-settings',
        title: t('onboarding.settings.title'),
        content: t('onboarding.settings.content'),
      },
      {
        id: 'onboarding-categories',
        title: t('onboarding.categories.title'),
        content: t('onboarding.categories.content'),
      },
      {
        id: 'onboarding-sources',
        title: t('onboarding.sources.title'),
        content: t('onboarding.sources.content'),
      },
      {
        id: 'onboarding-subscriptions',
        title: t('onboarding.subscriptions.title'),
        content: t('onboarding.subscriptions.content'),
      },
    ],
    [t],
  );
}
