import * as icons from '@fortawesome/free-solid-svg-icons';

import type { CategoryIconDef } from './categoryIcons';

export const categoryIconsShapes = [
  { value: 'heart', icon: icons.faHeart },
  { value: 'star', icon: icons.faStar },
  { value: 'cloud', icon: icons.faCloud },
  { value: 'calendar', icon: icons.faCalendar },
  { value: 'circle', icon: icons.faCircle },
  { value: 'play', icon: icons.faPlay },
  { value: 'square', icon: icons.faSquare },
  { value: 'diamond', icon: icons.faGem },
] as const satisfies readonly CategoryIconDef[];
