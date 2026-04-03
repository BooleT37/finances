import { NavLink, Stack } from '@mantine/core';
import {
  IconBuildingBank,
  IconCalendar,
  IconChartLine,
  IconTable,
} from '@tabler/icons-react';
import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { useMolecule } from 'bunshi/react';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';

import { confirmUnsavedChanges } from '~/features/transactions/components/TransactionSidebar/confirmUnsavedChanges';
import { TransactionSidebarMolecule } from '~/features/transactions/components/TransactionSidebar/transactionSidebarMolecule';

export function AppNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useTranslation('nav');
  const navigate = useNavigate();
  const { formRefAtom } = useMolecule(TransactionSidebarMolecule);
  const formRef = useAtomValue(formRefAtom);

  const items = [
    {
      to: '/transactions',
      label: t('transactions'),
      icon: <IconTable size={18} />,
    },
    {
      to: '/budgeting',
      label: t('planning'),
      icon: <IconCalendar size={18} />,
    },
    {
      to: '/savings-spendings',
      label: t('savings'),
      icon: <IconBuildingBank size={18} />,
    },
    {
      to: '/statistics',
      label: t('statistics'),
      icon: <IconChartLine size={18} />,
    },
  ];

  return (
    <Stack gap={0} pt="sm">
      {items.map((item) => (
        <NavLink
          key={item.to}
          component={Link}
          to={item.to}
          label={item.label}
          leftSection={item.icon}
          active={pathname === item.to}
          onClick={(e: React.MouseEvent) => {
            if (!formRef?.isDirty()) {
              return;
            }
            e.preventDefault();
            confirmUnsavedChanges(() => void navigate({ to: item.to }));
          }}
        />
      ))}
    </Stack>
  );
}
