import {
  OnboardingTour,
  type OnboardingTourProps,
  type OnboardingTourStep,
} from '@gfazioli/mantine-onboarding-tour';
import { useTranslation } from 'react-i18next';

import type { OnboardingFeatureKey } from '../sequence';
import { useFeatureOnboarding } from '../useFeatureOnboarding';

interface Props {
  featureKey: OnboardingFeatureKey;
  steps: OnboardingTourStep[];
  children: React.ReactNode;
  /** Fired when the active step changes (receives the step id). */
  onStepChange?: (stepId: string) => void;
  /** Fired once when the tour closes (both complete and skip), for cleanup. */
  onEnd?: () => void;
  focusRevealProps?: OnboardingTourProps['focusRevealProps'];
}

export function FeatureOnboardingTour({
  featureKey,
  steps,
  children,
  onStepChange,
  onEnd,
  focusRevealProps,
}: Props) {
  const { t } = useTranslation('onboarding');
  const { started, mode, endLabel, handleComplete, handleSkip } =
    useFeatureOnboarding(featureKey);

  return (
    <OnboardingTour
      tour={steps}
      started={started}
      withSkipButton={mode === 'sequence'}
      nextStepNavigation={t('next')}
      prevStepNavigation={t('back')}
      skipNavigation={t('skip')}
      endStepNavigation={endLabel}
      focusRevealProps={focusRevealProps}
      onOnboardingTourChange={(step) => onStepChange?.(step.id)}
      onOnboardingTourComplete={() => {
        onEnd?.();
        handleComplete();
      }}
      onOnboardingTourSkip={() => {
        onEnd?.();
        handleSkip();
      }}
    >
      {children}
    </OnboardingTour>
  );
}
