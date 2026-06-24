import { NavLink, Tooltip } from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface NavCollapseToggleProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function NavCollapseToggle({
  collapsed,
  onToggle,
}: NavCollapseToggleProps) {
  const { t } = useTranslation('nav');
  const ToggleIcon = collapsed ? IconChevronRight : IconChevronLeft;
  const toggleLabel = collapsed ? t('expandSidebar') : t('collapseSidebar');

  return (
    <Tooltip label={toggleLabel} position="right" withArrow>
      <NavLink
        component="button"
        leftSection={<ToggleIcon size={16} />}
        onClick={onToggle}
        aria-label={toggleLabel}
        styles={{
          root: { justifyContent: 'center', paddingInline: 0 },
          section: { margin: 0 },
          body: { display: 'none' },
        }}
      />
    </Tooltip>
  );
}
