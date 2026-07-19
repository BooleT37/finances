import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useAtom, useSetAtom } from 'jotai';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import {
  onboardingDecidedThisSessionAtom,
  onboardingSequenceIndexAtom,
  onboardingStandaloneRequestAtom,
} from './onboarding.atoms';
import { useCompleteOnboarding } from './queries';
import {
  featureIndex,
  type OnboardingFeatureKey,
  onboardingSequence,
} from './sequence';

export type OnboardingMode = 'off' | 'sequence' | 'standalone';

function goToLabelKey(key: OnboardingFeatureKey) {
  switch (key) {
    case 'transactions':
      return 'goTo.transactions' as const;
    case 'budgeting':
      return 'goTo.budgeting' as const;
    case 'savings':
      return 'goTo.savings' as const;
    case 'statistics':
      return 'goTo.statistics' as const;
    default:
      return null;
  }
}

export interface FeatureOnboarding {
  started: boolean;
  mode: OnboardingMode;
  /** Label of the last-step button ("Go to X" in sequence, else "Finish"). */
  endLabel: string;
  /** Called on `onOnboardingTourComplete` (advances the sequence or closes). */
  handleComplete: () => void;
  /** Called on `onOnboardingTourSkip` (aborts the whole sequence, or closes). */
  handleSkip: () => void;
}

export function useFeatureOnboarding(
  featureKey: OnboardingFeatureKey,
): FeatureOnboarding {
  const { t } = useTranslation('onboarding');
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [seqIndex, setSeqIndex] = useAtom(onboardingSequenceIndexAtom);
  const [standaloneFeature, setStandaloneFeature] = useAtom(
    onboardingStandaloneRequestAtom,
  );
  const setDecided = useSetAtom(onboardingDecidedThisSessionAtom);
  const { mutateAsync: complete } = useCompleteOnboarding();

  const myIndex = featureIndex(featureKey);
  const isSequenceTurn =
    seqIndex !== null && onboardingSequence[seqIndex]?.key === featureKey;

  const standaloneActive = standaloneFeature === featureKey && !isSequenceTurn;

  const mode: OnboardingMode = isSequenceTurn
    ? 'sequence'
    : standaloneActive
      ? 'standalone'
      : 'off';

  const nextFeature = onboardingSequence[myIndex + 1];

  const handleComplete = useCallback(() => {
    if (isSequenceTurn) {
      if (nextFeature) {
        setSeqIndex(myIndex + 1);
        if (nextFeature.route !== pathname) {
          void navigate({ to: nextFeature.route });
        }
      } else {
        setDecided(true);
        setSeqIndex(null);
        void complete({ reason: 'completed' });
      }
    } else {
      setStandaloneFeature(null);
    }
  }, [
    isSequenceTurn,
    nextFeature,
    myIndex,
    pathname,
    navigate,
    setSeqIndex,
    setStandaloneFeature,
    setDecided,
    complete,
  ]);

  const handleSkip = useCallback(() => {
    if (isSequenceTurn) {
      setDecided(true);
      setSeqIndex(null);
      void complete({ reason: 'skipped' });
    } else {
      setStandaloneFeature(null);
    }
  }, [isSequenceTurn, setSeqIndex, setStandaloneFeature, setDecided, complete]);

  const goToKey = nextFeature ? goToLabelKey(nextFeature.key) : null;
  const endLabel = mode === 'sequence' && goToKey ? t(goToKey) : t('finish');

  return {
    started: mode !== 'off',
    mode,
    endLabel,
    handleComplete,
    handleSkip,
  };
}
