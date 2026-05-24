import * as icons from '@fortawesome/free-solid-svg-icons';

import type { CategoryIconDef } from './categoryIcons';

export const categoryIconsClothingFashion = [
  { value: 'shirt', icon: icons.faTshirt },
] as const satisfies readonly CategoryIconDef[];
