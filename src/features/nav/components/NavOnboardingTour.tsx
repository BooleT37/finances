import { useNavigate } from '@tanstack/react-router';
import { useAtom, useAtomValue } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';

import { FeatureOnboardingTour } from '~/features/onboarding/components/FeatureOnboardingTour';
import { onboardingSequenceIndexAtom } from '~/features/onboarding/onboarding.atoms';
import { onboardingSequence } from '~/features/onboarding/sequence';

import { navCollapsedAtom } from '../navCollapsed.atom';
import {
  navOnboardingStepRoutes,
  useNavOnboardingSteps,
} from '../onboarding/useNavOnboardingSteps';

/**
 * Wraps the app shell so the first-run "nav" tour can highlight the settings
 * menu items via React context. Force-expands the sidebar while that group is
 * active so each item's label is readable, restoring the prior state after.
 */
export function NavOnboardingTour({ children }: { children: React.ReactNode }) {
  const steps = useNavOnboardingSteps();
  const seqIndex = useAtomValue(onboardingSequenceIndexAtom);
  const navActive =
    seqIndex !== null && onboardingSequence[seqIndex]?.key === 'nav';
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useAtom(navCollapsedAtom);
  const prevCollapsed = useRef<boolean | null>(null);

  const handleStepChange = useCallback(
    (stepId: string) => {
      const route = navOnboardingStepRoutes[stepId];
      if (route) {
        void navigate({ to: route });
      }
    },
    [navigate],
  );

  useEffect(() => {
    if (navActive && prevCollapsed.current === null) {
      prevCollapsed.current = collapsed;
      setCollapsed(false);
    } else if (!navActive && prevCollapsed.current !== null) {
      setCollapsed(prevCollapsed.current);
      prevCollapsed.current = null;
    }
  }, [navActive, collapsed, setCollapsed]);

  return (
    <FeatureOnboardingTour
      featureKey="nav"
      steps={steps}
      onStepChange={handleStepChange}
      focusRevealProps={{ popoverProps: { position: 'right' } }}
    >
      {children}
    </FeatureOnboardingTour>
  );
}
