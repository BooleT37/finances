import { Group } from '@mantine/core';

import { CategoryIconComp } from './categoryIcons/CategoryIconComp';

interface Props {
  name: string;
  icon?: string | null;
  testId?: string;
  /** Reserve a fixed-width icon slot even when there is no icon, so names stay left-aligned. */
  reserveIconSpace?: boolean;
  /** CSS font-size for the icon (it scales with font-size like text). Defaults to the surrounding text size. */
  iconSize?: string;
}

export function NameWithOptionalIcon({
  name,
  icon,
  testId,
  reserveIconSpace,
  iconSize,
}: Props) {
  if (!icon && !reserveIconSpace) {
    return <span data-testid={testId}>{name}</span>;
  }
  const iconComp = icon ? (
    <span style={iconSize ? { fontSize: iconSize } : undefined}>
      <CategoryIconComp value={icon} />
    </span>
  ) : null;
  return (
    <Group
      gap={4}
      style={{ display: 'inline-flex', flexWrap: 'nowrap' }}
      data-testid={testId}
    >
      {reserveIconSpace ? (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '1.25em',
            height: '1.25em',
            flexShrink: 0,
          }}
        >
          {iconComp}
        </span>
      ) : (
        iconComp
      )}
      <span data-testid={testId}>{name}</span>
    </Group>
  );
}
