import * as icons from '@fortawesome/free-solid-svg-icons';

import type { CategoryIcon } from './categoryIcons';

export const categoryIconsTransportation: CategoryIcon[] = [
  { value: 'car', label: 'Автомобиль', icon: icons.faCar },
  { value: 'truck', label: 'Грузовик', icon: icons.faTruck },
  { value: 'car-side', label: 'Автомобиль сбоку', icon: icons.faCarSide },
  { value: 'bicycle', label: 'Велосипед', icon: icons.faBicycle },
  { value: 'motorcycle', label: 'Мотоцикл', icon: icons.faMotorcycle },
  { value: 'taxi', label: 'Такси', icon: icons.faTaxi },
  { value: 'gas-pump', label: 'Заправка', icon: icons.faGasPump },
  { value: 'bus', label: 'Автобус', icon: icons.faBus },
  { value: 'bus-simple', label: 'Автобус (простой)', icon: icons.faBusSimple },
  { value: 'train', label: 'Поезд', icon: icons.faTrain },
  { value: 'train-subway', label: 'Метро', icon: icons.faTrainSubway },
  { value: 'plane', label: 'Самолет', icon: icons.faPlane },
  { value: 'rocket', label: 'Ракета', icon: icons.faRocket },
];
