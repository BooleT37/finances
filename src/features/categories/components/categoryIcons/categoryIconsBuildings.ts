import * as icons from '@fortawesome/free-solid-svg-icons';

import type { CategoryIcon } from './categoryIcons';

export const categoryIconsBuildings: CategoryIcon[] = [
  { value: 'house', label: 'Дом', icon: icons.faHome },
  { value: 'city', label: 'Город', icon: icons.faCity },
  {
    value: 'landmark',
    label: 'Достопримечательность',
    icon: icons.faLandmark,
  },
  { value: 'building', label: 'Здание', icon: icons.faBuilding },
  { value: 'store', label: 'Магазин', icon: icons.faStore },
  { value: 'school', label: 'Школа', icon: icons.faSchool },
  { value: 'hotel', label: 'Отель', icon: icons.faHotel },
  { value: 'hospital', label: 'Больница', icon: icons.faHospital },
  { value: 'church', label: 'Церковь', icon: icons.faChurch },
  { value: 'tree-city', label: 'Дерево в городе', icon: icons.faTreeCity },
  { value: 'tent', label: 'Палатка', icon: icons.faTent },
  { value: 'momument', label: 'Памятник', icon: icons.faMonument },
  {
    value: 'house-medical',
    label: 'Медицинский дом',
    icon: icons.faHouseMedical,
  },
  { value: 'campground', label: 'Кемпинг', icon: icons.faCampground },
  {
    value: 'building-columns',
    label: 'Здание с колоннами',
    icon: icons.faBuildingColumns,
  },
];
