import { Button, Group, Stack, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { useTranslation } from 'react-i18next';

interface Props {
  onYes: () => void;
  onNo: () => void;
}

export function CopyComponentsModal({ onYes, onNo }: Props) {
  const { t } = useTranslation('transactions');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        modals.closeAll();
        onYes();
      }}
    >
      <Stack gap="md">
        <Text size="sm">{t('copy.message')}</Text>
        <Group justify="flex-end" gap="xs">
          <Button type="submit" autoFocus>
            {t('copy.yes')}
          </Button>
          <Button
            variant="default"
            type="button"
            onClick={() => {
              modals.closeAll();
              onNo();
            }}
          >
            {t('copy.no')}
          </Button>
          <Button
            variant="subtle"
            type="button"
            onClick={() => modals.closeAll()}
          >
            {t('copy.cancel')}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
