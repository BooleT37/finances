import {
  ActionIcon,
  Card,
  Group,
  Table,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { openConfirmModal } from '@mantine/modals';
import {
  IconArchive,
  IconArchiveOff,
  IconPencil,
  IconTrash,
} from '@tabler/icons-react';
import Decimal from 'decimal.js';
import { useTranslation } from 'react-i18next';

import { costToString } from '~/shared/utils/costToString';

import type { SavingSpending } from '../../schema';

interface Props {
  item: SavingSpending;
  onEdit?: (item: SavingSpending) => void;
  onArchive?: (id: number) => void;
  onUnarchive?: (id: number) => void;
  onDelete: (id: number) => void;
}

export function SavingSpendingCard({
  item,
  onEdit,
  onArchive,
  onUnarchive,
  onDelete,
}: Props) {
  const { t } = useTranslation('savingSpendings');
  const singleCategory = item.categories.length === 1;

  function handleDelete() {
    openConfirmModal({
      title: t('delete.confirmTitle'),
      children: t('delete.confirmMessage', { name: item.name }),
      labels: { confirm: t('delete.confirm'), cancel: t('delete.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: () => onDelete(item.id),
    });
  }

  return (
    <Card withBorder padding="md">
      <Group justify="space-between" mb="sm" wrap="nowrap">
        <Title order={4} style={{ flex: 1 }}>
          {item.name}
        </Title>
        <Group gap={4} wrap="nowrap">
          {onEdit && (
            <Tooltip label={t('actions.edit')}>
              <ActionIcon
                variant="subtle"
                aria-label={t('actions.edit')}
                onClick={() => onEdit(item)}
              >
                <IconPencil size={16} />
              </ActionIcon>
            </Tooltip>
          )}
          {onArchive && (
            <Tooltip label={t('actions.archive')}>
              <ActionIcon
                variant="subtle"
                aria-label={t('actions.archive')}
                onClick={() => onArchive(item.id)}
              >
                <IconArchive size={16} />
              </ActionIcon>
            </Tooltip>
          )}
          {onUnarchive && (
            <Tooltip label={t('actions.unarchive')}>
              <ActionIcon
                variant="subtle"
                aria-label={t('actions.unarchive')}
                onClick={() => onUnarchive(item.id)}
              >
                <IconArchiveOff size={16} />
              </ActionIcon>
            </Tooltip>
          )}
          <Tooltip label={t('actions.delete')}>
            <ActionIcon
              variant="subtle"
              color="red"
              aria-label={t('actions.delete')}
              onClick={handleDelete}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      <Table fz="sm">
        <Table.Thead>
          <Table.Tr>
            {!singleCategory && <Table.Th>{t('table.category')}</Table.Th>}
            <Table.Th style={{ textAlign: 'right' }}>
              {t('table.plan')}
            </Table.Th>
            <Table.Th style={{ textAlign: 'right' }}>
              {t('table.actual')}
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {item.categories.map((cat) => {
            const overBudget = cat.actual.greaterThan(cat.forecast);
            return (
              <Table.Tr key={cat.id}>
                {!singleCategory && <Table.Td>{cat.name}</Table.Td>}
                <Table.Td style={{ textAlign: 'right' }}>
                  {costToString(cat.forecast)}
                </Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>
                  <Text span c={overBudget ? 'red' : undefined} fz="sm">
                    {costToString(cat.actual)}
                  </Text>
                </Table.Td>
              </Table.Tr>
            );
          })}
          {!singleCategory &&
            (() => {
              const totalForecast = item.categories.reduce(
                (sum, cat) => sum.plus(cat.forecast),
                new Decimal(0),
              );
              const totalActual = item.categories.reduce(
                (sum, cat) => sum.plus(cat.actual),
                new Decimal(0),
              );
              const totalOverBudget = totalActual.greaterThan(totalForecast);
              return (
                <Table.Tr fw="bold">
                  <Table.Td>{t('table.total')}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    {costToString(totalForecast)}
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    <Text
                      span
                      c={totalOverBudget ? 'red' : undefined}
                      fz="sm"
                      fw="bold"
                    >
                      {costToString(totalActual)}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              );
            })()}
        </Table.Tbody>
      </Table>
    </Card>
  );
}
