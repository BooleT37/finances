import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import { categoryIconsAccessibility } from './categoryIconsAccessibility';
import { categoryIconsAlerts } from './categoryIconsAlerts';
import { categoryIconsAnimals } from './categoryIconsAnimals';
import { categoryIconsBuildings } from './categoryIconsBuildings';
import { categoryIconsBusiness } from './categoryIconsBusiness';
import { categoryIconsChildhood } from './categoryIconsChildhood';
import { categoryIconsClothingFashion } from './categoryIconsClothingFashion';
import { categoryIconsDevices } from './categoryIconsDevices';
import { categoryIconsFood } from './categoryIconsFood';
import { categoryIconsHousehold } from './categoryIconsHousehold';
import { categoryIconsOther } from './categoryIconsOther';
import { categoryIconsShapes } from './categoryIconsShapes';
import { categoryIconsShopping } from './categoryIconsShopping';
import { categoryIconsTransportation } from './categoryIconsTransportation';
import { categoryIconsTravel } from './categoryIconsTravel';

export interface CategoryIcon {
  value: string;
  label: string;
  icon: IconDefinition;
}

export const categoryIconsGroups = [
  { group: 'Бизнес', icons: categoryIconsBusiness },
  { group: 'Еда', icons: categoryIconsFood },
  { group: 'Быт', icons: categoryIconsHousehold },
  { group: 'Покупки', icons: categoryIconsShopping },
  { group: 'Одежда и мода', icons: categoryIconsClothingFashion },
  { group: 'Устройства', icons: categoryIconsDevices },
  { group: 'Детство', icons: categoryIconsChildhood },
  { group: 'Животные', icons: categoryIconsAnimals },
  { group: 'Здания', icons: categoryIconsBuildings },
  { group: 'Транспорт', icons: categoryIconsTransportation },
  { group: 'Путешествия', icons: categoryIconsTravel },
  { group: 'Доступность', icons: categoryIconsAccessibility },
  { group: 'Оповещения', icons: categoryIconsAlerts },
  { group: 'Формы', icons: categoryIconsShapes },
  { group: 'Прочее', icons: categoryIconsOther },
];

export const getIconByValue = (value: string) =>
  categoryIconsGroups
    .flatMap((group) => group.icons)
    .find((icon) => icon.value === value)?.icon;
