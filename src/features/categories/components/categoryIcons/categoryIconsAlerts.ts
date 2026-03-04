import * as icons from '@fortawesome/free-solid-svg-icons';

import type { CategoryIcon } from './categoryIcons';

export const categoryIconsAlerts: CategoryIcon[] = [
  { value: 'bell', label: 'Колокольчик', icon: icons.faBell },
  {
    value: 'circle-exclamation',
    label: 'Восклицание',
    icon: icons.faCircleExclamation,
  },
  { value: 'exclamation', label: 'Восклицание', icon: icons.faExclamation },
  {
    value: 'exclamation-triangle',
    label: 'Треугольник с восклицанием',
    icon: icons.faExclamationTriangle,
  },
  {
    value: 'exclamation-circle',
    label: 'Круг с восклицанием',
    icon: icons.faExclamationCircle,
  },
];
