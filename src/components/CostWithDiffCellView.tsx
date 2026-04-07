import { Group, Stack, Tooltip } from '@mantine/core';
import Decimal from 'decimal.js';
import { useTranslation } from 'react-i18next';

import { costToDiffString, costToString } from '~/shared/utils/costToString';

import { getCostWithDiffParams } from './getCostWithDiffParams';

interface Props {
  cost: Decimal;
  forecast: Decimal;
  isContinuous: boolean;
  /** 1-based month (1-12) */
  month: number;
  year: number;
  /** Show a "Plan: X" tooltip on the diff label; always shown when spending exceeds pace */
  showPlanTooltip?: boolean;
}

export function CostWithDiffCellView({
  cost,
  forecast,
  isContinuous,
  month,
  year,
  showPlanTooltip,
}: Props) {
  const { t } = useTranslation('common');

  const result = getCostWithDiffParams({
    value: { cost },
    forecast,
    isContinuous,
    month,
    year,
  });
  const { diff, color, barLength, barOffset, exceedingAmount } = result;

  const tooltipLabel =
    exceedingAmount !== undefined ? (
      <Stack gap={0}>
        <div>{t('forecast.plan', { value: costToString(forecast) })}</div>
        <div>
          {t('forecast.exceededBy', { value: costToString(exceedingAmount) })}
        </div>
      </Stack>
    ) : showPlanTooltip ? (
      t('forecast.plan', { value: costToString(forecast) })
    ) : undefined;

  return (
    <div>
      <Group wrap="nowrap" gap={4}>
        <div style={{ whiteSpace: 'nowrap' }}>{costToString(cost)}</div>
        <Tooltip disabled={!tooltipLabel} label={tooltipLabel}>
          <span style={{ fontSize: 12, color, whiteSpace: 'nowrap' }}>
            {costToDiffString(diff)}
          </span>
        </Tooltip>
      </Group>
      <div
        style={{
          position: 'relative',
          border: '1px solid gray',
          height: 4,
          width: 60,
        }}
      >
        <div
          style={{
            height: 2,
            backgroundColor: color,
            width: `${barLength * 100}%`,
            marginLeft: `${barOffset * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
