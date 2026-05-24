import * as icons from '@fortawesome/free-solid-svg-icons';

import type { CategoryIconDef } from './categoryIcons';

export const categoryIconsFood = [
  { value: 'mug-saucer', icon: icons.faMugSaucer },
  { value: 'pizza-slice', icon: icons.faPizzaSlice },
  { value: 'wine-glass', icon: icons.faWineGlass },
  { value: 'cart-shopping', icon: icons.faShoppingCart },
] as const satisfies readonly CategoryIconDef[];
