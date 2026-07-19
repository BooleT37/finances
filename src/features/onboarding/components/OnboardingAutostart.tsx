import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useAtom, useAtomValue } from 'jotai';
import { useEffect, useRef } from 'react';

import {
  onboardingDecidedThisSessionAtom,
  onboardingSequenceIndexAtom,
} from '../onboarding.atoms';
import { getOnboardingStatusQueryOptions } from '../queries';
import { onboardingSequence } from '../sequence';

/**
 * Kicks off the first-run sequential tour once, when the signed-in user has
 * never finished or skipped it. Renders nothing.
 */
export function OnboardingAutostart() {
  const { data: status } = useQuery(getOnboardingStatusQueryOptions());
  const [seqIndex, setSeqIndex] = useAtom(onboardingSequenceIndexAtom);
  const decided = useAtomValue(onboardingDecidedThisSessionAtom);
  const navigate = useNavigate();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || decided || seqIndex !== null) {
      return;
    }
    if (status && !status.completed) {
      startedRef.current = true;
      setSeqIndex(0);
      void navigate({ to: onboardingSequence[0].route });
    }
  }, [status, decided, seqIndex, setSeqIndex, navigate]);

  return null;
}
