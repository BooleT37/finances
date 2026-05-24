import * as icons from '@fortawesome/free-solid-svg-icons';

import type { CategoryIconDef } from './categoryIcons';

export const categoryIconsTransportation = [
  { value: 'car', icon: icons.faCar },
  { value: 'truck', icon: icons.faTruck },
  { value: 'car-side', icon: icons.faCarSide },
  { value: 'bicycle', icon: icons.faBicycle },
  { value: 'motorcycle', icon: icons.faMotorcycle },
  { value: 'taxi', icon: icons.faTaxi },
  { value: 'gas-pump', icon: icons.faGasPump },
  { value: 'bus', icon: icons.faBus },
  { value: 'bus-simple', icon: icons.faBusSimple },
  { value: 'train', icon: icons.faTrain },
  { value: 'train-subway', icon: icons.faTrainSubway },
  { value: 'plane', icon: icons.faPlane },
  { value: 'rocket', icon: icons.faRocket },
] as const satisfies readonly CategoryIconDef[];
