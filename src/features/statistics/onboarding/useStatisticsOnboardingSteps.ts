import type { OnboardingTourStep } from '@gfazioli/mantine-onboarding-tour';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export function useStatisticsOnboardingSteps(): OnboardingTourStep[] {
  const { t } = useTranslation('statistics');

  return useMemo(
    () => [
      {
        id: 'statistics-intro',
        title: t('onboarding.intro.title'),
        content: t('onboarding.intro.content'),
        focusRevealProps: { popoverProps: { position: 'bottom' } },
      },
    ],
    [t],
  );
}
