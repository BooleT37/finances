import type { ReactNode } from 'react';

export interface SegmentedControlWithIconsItem {
  label: string;
  value: string;
  icon: ReactNode;
  disabled?: boolean;
  onboardingTourId?: string;
}
