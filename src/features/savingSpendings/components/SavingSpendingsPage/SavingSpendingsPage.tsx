import { OnboardingTour } from '@gfazioli/mantine-onboarding-tour';
import { Box, Button, Group, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArchive, IconPlus } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FeatureOnboardingTour } from '~/features/onboarding/components/FeatureOnboardingTour';

import { useSavingSpendingsOnboardingSteps } from '../../onboarding/useSavingSpendingsOnboardingSteps';
import {
  getSavingSpendingsQueryOptions,
  useArchiveSavingSpending,
  useDeleteSavingSpending,
} from '../../queries';
import type { SavingSpending } from '../../schema';
import { SavingSpendingCard } from './SavingSpendingCard';
import { SavingSpendingModal } from './SavingSpendingModal';

export function SavingSpendingsPage() {
  const { t } = useTranslation('savingSpendings');
  const { data: allItems = [] } = useQuery(getSavingSpendingsQueryOptions());
  const deleteMutation = useDeleteSavingSpending();
  const archiveMutation = useArchiveSavingSpending();

  const [modal, setModal] = useState<{
    open: boolean;
    editItem: SavingSpending | null;
  }>({ open: false, editItem: null });

  const steps = useSavingSpendingsOnboardingSteps();

  const items = allItems.filter((s) => !s.completed);

  function openCreate() {
    setModal({ open: true, editItem: null });
  }

  function openEdit(item: SavingSpending) {
    setModal({ open: true, editItem: item });
  }

  function closeModal() {
    setModal({ open: false, editItem: null });
  }

  function handleArchive(id: number) {
    archiveMutation.mutate(id, {
      onSuccess: () =>
        notifications.show({
          message: t('notifications.archived'),
          color: 'green',
        }),
    });
  }

  function handleDelete(id: number) {
    deleteMutation.mutate(id, {
      onSuccess: () =>
        notifications.show({
          message: t('notifications.deleted'),
          color: 'green',
        }),
    });
  }

  return (
    <FeatureOnboardingTour featureKey="savings" steps={steps}>
      <Stack gap="md" data-onboarding-tour-id="savings-intro" bg="white">
        <Group gap="sm">
          <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
            {t('newEvent')}
          </Button>
          <OnboardingTour.Target id="savings-archive">
            <Button
              variant="default"
              leftSection={<IconArchive size={16} />}
              component={Link}
              to="/savings-spendings/archive"
            >
              {t('archive')}
            </Button>
          </OnboardingTour.Target>
        </Group>

        <Box
          style={{
            columns: '320px',
            columnGap: 'var(--mantine-spacing-md)',
          }}
        >
          {items.map((item) => (
            <Box
              key={item.id}
              style={{
                breakInside: 'avoid',
                marginBottom: 'var(--mantine-spacing-md)',
              }}
            >
              <SavingSpendingCard
                item={item}
                onEdit={openEdit}
                onArchive={handleArchive}
                onDelete={handleDelete}
              />
            </Box>
          ))}
        </Box>

        <SavingSpendingModal
          opened={modal.open}
          onClose={closeModal}
          editItem={modal.editItem}
        />
      </Stack>
    </FeatureOnboardingTour>
  );
}
