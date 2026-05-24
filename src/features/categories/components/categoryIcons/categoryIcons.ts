import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { useTranslation } from 'react-i18next';

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

export interface CategoryIconDef {
  value: string;
  icon: IconDefinition;
}

const categoryIconDefsGroups = [
  { groupKey: 'business', icons: categoryIconsBusiness },
  { groupKey: 'food', icons: categoryIconsFood },
  { groupKey: 'household', icons: categoryIconsHousehold },
  { groupKey: 'shopping', icons: categoryIconsShopping },
  { groupKey: 'clothingFashion', icons: categoryIconsClothingFashion },
  { groupKey: 'devices', icons: categoryIconsDevices },
  { groupKey: 'childhood', icons: categoryIconsChildhood },
  { groupKey: 'animals', icons: categoryIconsAnimals },
  { groupKey: 'buildings', icons: categoryIconsBuildings },
  { groupKey: 'transportation', icons: categoryIconsTransportation },
  { groupKey: 'travel', icons: categoryIconsTravel },
  { groupKey: 'accessibility', icons: categoryIconsAccessibility },
  { groupKey: 'alerts', icons: categoryIconsAlerts },
  { groupKey: 'shapes', icons: categoryIconsShapes },
  { groupKey: 'other', icons: categoryIconsOther },
] as const;

export function useCategoryIconsGroups() {
  const { t } = useTranslation('categories');
  return categoryIconDefsGroups.map((group) => ({
    group: t(`iconGroups.${group.groupKey}`),
    icons: group.icons.map((icon) => ({
      ...icon,
      label: t(`iconLabels.${icon.value}`),
    })),
  }));
}

export const getIconByValue = (value: string): IconDefinition | undefined => {
  for (const group of categoryIconDefsGroups) {
    for (const icon of group.icons) {
      if (icon.value === value) {
        return icon.icon;
      }
    }
  }
  return undefined;
};
