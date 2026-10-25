import { Group, Switch, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconInfoCircle } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useRouteContext } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import {
  getProjectSettingsQueryOptions,
  useSetCategorySuggestionsEnabled,
} from '../queries';

export function CategorySuggestionsSwitch() {
  const { t } = useTranslation('projectSettings');
  const { session } = useRouteContext({ from: '/_authenticated' });
  const isAdmin = session.role === 'admin';
  const { data: settings } = useQuery(getProjectSettingsQueryOptions());
  const setEnabledMutation = useSetCategorySuggestionsEnabled();

  if (!settings) {
    return null;
  }

  function handleChange(enabled: boolean) {
    setEnabledMutation.mutate(
      { enabled },
      {
        onSuccess: () => {
          notifications.show({
            color: 'green',
            message: enabled
              ? t('categorySuggestions.notifications.enabled')
              : t('categorySuggestions.notifications.disabled'),
          });
        },
        onError: () => {
          notifications.show({
            color: 'red',
            message: t('categorySuggestions.notifications.error'),
          });
        },
      },
    );
  }

  return (
    <Group gap="xs" align="center">
      <Switch
        label={t('categorySuggestions.label')}
        description={isAdmin ? undefined : t('categorySuggestions.adminOnly')}
        checked={settings.categorySuggestionsEnabled}
        disabled={!isAdmin || setEnabledMutation.isPending}
        onChange={(event) => handleChange(event.currentTarget.checked)}
      />
      <Tooltip
        label={t('categorySuggestions.description')}
        multiline
        w={360}
        withArrow
      >
        <IconInfoCircle
          size={16}
          style={{ color: 'var(--mantine-color-dimmed)' }}
        />
      </Tooltip>
    </Group>
  );
}
