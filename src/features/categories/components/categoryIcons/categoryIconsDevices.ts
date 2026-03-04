import * as icons from '@fortawesome/free-solid-svg-icons';

import type { CategoryIcon } from './categoryIcons';

export const categoryIconsDevices: CategoryIcon[] = [
  { value: 'laptop', label: 'Ноутбук', icon: icons.faLaptop },
  { value: 'plug', label: 'Вилка', icon: icons.faPlug },
  { value: 'tv', label: 'Телевизор', icon: icons.faTv },
  { value: 'mobile', label: 'Мобильный телефон', icon: icons.faMobile },
  { value: 'camera', label: 'Камера', icon: icons.faCamera },
  { value: 'ethernet', label: 'Ethernet', icon: icons.faEthernet },
];
