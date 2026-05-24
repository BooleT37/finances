import * as icons from '@fortawesome/free-solid-svg-icons';

import type { CategoryIconDef } from './categoryIcons';

export const categoryIconsAnimals = [
  { value: 'fish', icon: icons.faFish },
  { value: 'spider', icon: icons.faSpider },
  { value: 'paw', icon: icons.faPaw },
  { value: 'horse-head', icon: icons.faHorseHead },
  { value: 'horse', icon: icons.faHorse },
  { value: 'fish-fins', icon: icons.faFishFins },
  { value: 'dove', icon: icons.faDove },
  { value: 'dog', icon: icons.faDog },
  { value: 'crow', icon: icons.faCrow },
  { value: 'cat', icon: icons.faCat },
  { value: 'bugs', icon: icons.faBugs },
] as const satisfies readonly CategoryIconDef[];
