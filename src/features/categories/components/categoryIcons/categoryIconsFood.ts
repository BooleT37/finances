import * as icons from '@fortawesome/free-solid-svg-icons';

import type { CategoryIcon } from './categoryIcons';

export const categoryIconsFood: CategoryIcon[] = [
  { value: 'mug-saucer', label: 'Чашка с блюдцем', icon: icons.faMugSaucer },
  { value: 'pizza-slice', label: 'Ломтик пиццы', icon: icons.faPizzaSlice },
  { value: 'wine-glass', label: 'Бокал с вином', icon: icons.faWineGlass },
  {
    value: 'cart-shopping',
    label: 'Тележка с покупками',
    icon: icons.faShoppingCart,
  },
];
