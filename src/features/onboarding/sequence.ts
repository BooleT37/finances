export type OnboardingFeatureKey =
  | 'nav'
  | 'transactions'
  | 'budgeting'
  | 'savings'
  | 'statistics';

export interface OnboardingFeature {
  key: OnboardingFeatureKey;
  /** Route the user is on while this feature's tour runs. */
  route: string;
}

/**
 * Order of the first-run sequential tour. The `nav` group highlights the
 * settings menu (always visible in the sidebar) while the user sits on
 * `/transactions`, then hands off to each feature page in turn.
 */
export const onboardingSequence: OnboardingFeature[] = [
  { key: 'nav', route: '/transactions' },
  { key: 'transactions', route: '/transactions' },
  { key: 'budgeting', route: '/budgeting' },
  { key: 'savings', route: '/savings-spendings' },
  { key: 'statistics', route: '/statistics' },
];

export function featureIndex(key: OnboardingFeatureKey): number {
  return onboardingSequence.findIndex((f) => f.key === key);
}

/** Feature key whose standalone "?" tour applies to the given route, if any. */
export function standaloneFeatureForRoute(
  pathname: string,
): OnboardingFeatureKey | null {
  const match = onboardingSequence.find(
    (f) => f.key !== 'nav' && f.route === pathname,
  );
  return match?.key ?? null;
}
