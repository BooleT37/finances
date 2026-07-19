import { atom } from 'jotai';

import type { OnboardingFeatureKey } from './sequence';

/**
 * Index into {@link onboardingSequence} of the feature whose tour is currently
 * active in the first-run sequence, or `null` when the sequence is not running.
 *
 * Deliberately in-memory only (not persisted): a hard refresh mid-tour restarts
 * the sequence from the beginning next load, which is acceptable since
 * `onboardingCompletedAt` stays null until the user explicitly finishes or skips.
 */
export const onboardingSequenceIndexAtom = atom<number | null>(null);

/**
 * Set to a feature key by the breadcrumb "?" button to launch that page's
 * standalone tour. The page consumes and resets it back to `null`.
 */
export const onboardingStandaloneRequestAtom =
  atom<OnboardingFeatureKey | null>(null);

/**
 * Flipped synchronously the moment the user explicitly finishes or skips the
 * first-run sequence, in the same tick as resetting {@link onboardingSequenceIndexAtom}
 * to null. OnboardingAutostart must consult this instead of the async
 * `completeOnboarding`/`fetchOnboardingStatus` query result for the "should I
 * restart" decision: that query's cached value can briefly still read stale
 * (an unrelated in-flight background refetch can resolve after the mutation's
 * optimistic update and overwrite it), which would otherwise cause the
 * sequence to incorrectly restart right after the user just dismissed it.
 */
export const onboardingDecidedThisSessionAtom = atom(false);
