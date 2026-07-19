import { OnboardingTour } from '@gfazioli/mantine-onboarding-tour';
import { Group, Tooltip } from '@mantine/core';

import type { SegmentedControlWithIconsItem } from './SegmentedControlWithIcons.types';

const labelSlideStyle = (visible: boolean): React.CSSProperties => ({
  maxWidth: visible ? 120 : 0,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  opacity: visible ? 1 : 0,
  paddingLeft: visible ? 4 : 0,
  transition:
    'max-width 150ms ease, opacity 150ms ease, padding-left 150ms ease',
});

interface Props {
  item: SegmentedControlWithIconsItem;
  value: string | undefined;
}

export function SegmentedControlWithIconsLabel({
  item,
  value,
}: Props): React.ReactNode {
  const content = (
    <Group gap={0} wrap="nowrap" justify="center">
      {item.icon}
      <span style={labelSlideStyle(value === item.value)}>{item.label}</span>
    </Group>
  );
  return (
    <Tooltip label={item.label} disabled={value === item.value}>
      {item.onboardingTourId ? (
        <OnboardingTour.Target id={item.onboardingTourId}>
          {content}
        </OnboardingTour.Target>
      ) : (
        content
      )}
    </Tooltip>
  );
}
