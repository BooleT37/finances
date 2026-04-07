import { Group } from '@mantine/core';

import { CategoryIconComp } from './categoryIcons/CategoryIconComp';

interface Props {
  name: string;
  icon?: string | null;
  testId?: string;
}

export function NameWithOptionalIcon({ name, icon, testId }: Props) {
  if (icon) {
    return (
      <Group
        gap={4}
        style={{ display: 'inline-flex', flexWrap: 'nowrap' }}
        data-testid={testId}
      >
        <CategoryIconComp value={icon} />
        {name}
      </Group>
    );
  }
  return <span data-testid={testId}>{name}</span>;
}
