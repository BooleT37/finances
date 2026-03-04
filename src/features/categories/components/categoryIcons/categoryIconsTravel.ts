import * as icons from '@fortawesome/free-solid-svg-icons';

import type { CategoryIcon } from './categoryIcons';

export const categoryIconsTravel: CategoryIcon[] = [
  { value: 'earth-europe', label: 'Земля', icon: icons.faEarthEurope },
  { value: 'map', label: 'Карта', icon: icons.faMap },
  { value: 'tree', label: 'Дерево', icon: icons.faTree },
  { value: 'bed', label: 'Кровать', icon: icons.faBed },
  { value: 'infinity', label: 'Бесконечность', icon: icons.faInfinity },
  {
    value: 'umbrella-beach',
    label: 'Зонтик на пляже',
    icon: icons.faUmbrellaBeach,
  },
  { value: 'suitcase', label: 'Чемодан', icon: icons.faSuitcase },
  { value: 'smoking', label: 'Курение', icon: icons.faSmoking },
  { value: 'kit-medical', label: 'Медицинский набор', icon: icons.faMedkit },
];
