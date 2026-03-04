import * as icons from '@fortawesome/free-solid-svg-icons';

import type { CategoryIcon } from './categoryIcons';

export const categoryIconsShopping: CategoryIcon[] = [
  { value: 'shop', label: 'Магазин', icon: icons.faStore },
  { value: 'gift', label: 'Подарок', icon: icons.faGift },
  {
    value: 'bag-shopping',
    label: 'Сумка с покупками',
    icon: icons.faShoppingBag,
  },
  {
    value: 'basket-shopping',
    label: 'Корзина с покупками',
    icon: icons.faShoppingBasket,
  },
];
