import type { OnboardingTourStep } from '@gfazioli/mantine-onboarding-tour';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export const TRANSACTIONS_FROM_SAVINGS_STEP_ID = 'transactions-from-savings';

export function useTransactionsOnboardingSteps(): OnboardingTourStep[] {
  const { t } = useTranslation('transactions');

  return useMemo(
    () => [
      {
        id: 'transactions-intro',
        title: t('onboarding.intro.title'),
        content: t('onboarding.intro.content'),
        focusRevealProps: { popoverProps: { position: 'bottom' } },
      },
      {
        id: TRANSACTIONS_FROM_SAVINGS_STEP_ID,
        title: t('onboarding.fromSavings.title'),
        content: t('onboarding.fromSavings.content'),
        focusRevealProps: { popoverProps: { position: 'left' } },
      },
    ],
    [t],
  );
}
