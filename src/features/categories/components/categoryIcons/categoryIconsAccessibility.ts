import * as icons from '@fortawesome/free-solid-svg-icons';

import type { CategoryIconDef } from './categoryIcons';

export const categoryIconsAccessibility = [
  { value: 'circle-info', icon: icons.faInfoCircle },
  { value: 'eye', icon: icons.faEye },
  { value: 'question', icon: icons.faQuestion },
  { value: 'phone-volume', icon: icons.faPhoneVolume },
  { value: 'person-cane', icon: icons.faPersonCane },
  { value: 'circle-question', icon: icons.faCircleQuestion },
] as const satisfies readonly CategoryIconDef[];
