import * as icons from '@fortawesome/free-solid-svg-icons';

import type { CategoryIconDef } from './categoryIcons';

export const categoryIconsTravel = [
  { value: 'earth-europe', icon: icons.faEarthEurope },
  { value: 'map', icon: icons.faMap },
  { value: 'tree', icon: icons.faTree },
  { value: 'bed', icon: icons.faBed },
  { value: 'infinity', icon: icons.faInfinity },
  { value: 'umbrella-beach', icon: icons.faUmbrellaBeach },
  { value: 'suitcase', icon: icons.faSuitcase },
  { value: 'smoking', icon: icons.faSmoking },
  { value: 'kit-medical', icon: icons.faMedkit },
] as const satisfies readonly CategoryIconDef[];
