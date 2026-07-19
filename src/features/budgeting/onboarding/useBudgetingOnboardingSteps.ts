import type { OnboardingTourStep } from '@gfazioli/mantine-onboarding-tour';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export function useBudgetingOnboardingSteps(): OnboardingTourStep[] {
  const { t } = useTranslation('budgeting');

  return useMemo(
    () => [
      {
        id: 'budgeting-intro',
        title: t('onboarding.intro.title'),
        content: t('onboarding.intro.content'),
        focusRevealProps: { popoverProps: { position: 'bottom' } },
      },
      {
        id: 'budgeting-plan-header',
        title: t('onboarding.planHeader.title'),
        content: t('onboarding.planHeader.content'),
      },
      {
        id: 'budgeting-thismonth-header',
        title: t('onboarding.thisMonthHeader.title'),
        content: t('onboarding.thisMonthHeader.content'),
      },
      {
        id: 'budgeting-grandtotal-plan',
        title: t('onboarding.grandTotalPlan.title'),
        content: t('onboarding.grandTotalPlan.content'),
      },
      {
        id: 'budgeting-grandtotal-fact',
        title: t('onboarding.grandTotalFact.title'),
        content: t('onboarding.grandTotalFact.content'),
      },
    ],
    [t],
  );
}
