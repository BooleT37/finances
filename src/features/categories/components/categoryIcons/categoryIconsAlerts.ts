import * as icons from '@fortawesome/free-solid-svg-icons';

import type { CategoryIconDef } from './categoryIcons';

export const categoryIconsAlerts = [
  { value: 'bell', icon: icons.faBell },
  { value: 'circle-exclamation', icon: icons.faCircleExclamation },
  { value: 'exclamation', icon: icons.faExclamation },
  { value: 'exclamation-triangle', icon: icons.faExclamationTriangle },
  { value: 'exclamation-circle', icon: icons.faExclamationCircle },
] as const satisfies readonly CategoryIconDef[];
