import * as icons from '@fortawesome/free-solid-svg-icons';

import type { CategoryIconDef } from './categoryIcons';

export const categoryIconsShopping = [
  { value: 'shop', icon: icons.faStore },
  { value: 'gift', icon: icons.faGift },
  { value: 'bag-shopping', icon: icons.faShoppingBag },
  { value: 'basket-shopping', icon: icons.faShoppingBasket },
] as const satisfies readonly CategoryIconDef[];
