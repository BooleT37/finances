import * as icons from '@fortawesome/free-solid-svg-icons';

import type { CategoryIconDef } from './categoryIcons';

export const categoryIconsDevices = [
  { value: 'laptop', icon: icons.faLaptop },
  { value: 'plug', icon: icons.faPlug },
  { value: 'tv', icon: icons.faTv },
  { value: 'mobile', icon: icons.faMobile },
  { value: 'camera', icon: icons.faCamera },
  { value: 'ethernet', icon: icons.faEthernet },
] as const satisfies readonly CategoryIconDef[];
