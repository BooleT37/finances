import type { OnboardingTourStep } from '@gfazioli/mantine-onboarding-tour';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export function useSavingSpendingsOnboardingSteps(): OnboardingTourStep[] {
  const { t } = useTranslation('savingSpendings');

  return useMemo(
    () => [
      {
        id: 'savings-intro',
        title: t('onboarding.intro.title'),
        content: t('onboarding.intro.content'),
        focusRevealProps: { popoverProps: { position: 'bottom' } },
      },
      {
        id: 'savings-archive',
        title: t('onboarding.archive.title'),
        content: t('onboarding.archive.content'),
      },
    ],
    [t],
  );
}
