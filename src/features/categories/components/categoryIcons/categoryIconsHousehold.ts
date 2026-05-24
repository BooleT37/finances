import * as icons from '@fortawesome/free-solid-svg-icons';

import type { CategoryIconDef } from './categoryIcons';

export const categoryIconsHousehold = [
  { value: 'bath', icon: icons.faBath },
  { value: 'snowflake', icon: icons.faSnowflake },
  { value: 'shower', icon: icons.faShower },
  { value: 'soap', icon: icons.faSoap },
  { value: 'lightbulb', icon: icons.faLightbulb },
  { value: 'couch', icon: icons.faCouch },
] as const satisfies readonly CategoryIconDef[];
