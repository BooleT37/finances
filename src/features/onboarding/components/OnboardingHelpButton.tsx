import { ActionIcon, Tooltip } from '@mantine/core';
import { IconHelpCircle } from '@tabler/icons-react';
import { useRouterState } from '@tanstack/react-router';
import { useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { onboardingStandaloneRequestAtom } from '../onboarding.atoms';
import { standaloneFeatureForRoute } from '../sequence';

export function OnboardingHelpButton() {
  const { t } = useTranslation('onboarding');
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const requestStandalone = useSetAtom(onboardingStandaloneRequestAtom);

  const featureKey = standaloneFeatureForRoute(pathname);
  if (!featureKey) {
    return null;
  }

  return (
    <Tooltip label={t('helpTooltip')} position="right">
      <ActionIcon
        variant="subtle"
        size="sm"
        aria-label={t('helpTooltip')}
        onClick={() => requestStandalone(featureKey)}
      >
        <IconHelpCircle size={16} color="gray" />
      </ActionIcon>
    </Tooltip>
  );
}
