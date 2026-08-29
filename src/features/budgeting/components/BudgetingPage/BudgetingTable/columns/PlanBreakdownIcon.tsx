import type { ActionIconProps } from '@mantine/core';
import { ActionIcon } from '@mantine/core';
import { IconCalculator } from '@tabler/icons-react';
import type { ComponentPropsWithRef } from 'react';
import { useTranslation } from 'react-i18next';

type Props = ActionIconProps & ComponentPropsWithRef<'button'>;

/** Props are spread through so a `HoverCard.Target` can inject its ref and handlers. */
export function PlanBreakdownIcon(props: Props) {
  const { t } = useTranslation('budgeting');

  return (
    <ActionIcon
      variant="subtle"
      size="sm"
      color="gray"
      aria-label={t('breakdown.openBreakdown')}
      {...props}
    >
      <IconCalculator size={17} />
    </ActionIcon>
  );
}
