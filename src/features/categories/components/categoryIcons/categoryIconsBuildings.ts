import * as icons from '@fortawesome/free-solid-svg-icons';

import type { CategoryIconDef } from './categoryIcons';

export const categoryIconsBuildings = [
  { value: 'house', icon: icons.faHome },
  { value: 'city', icon: icons.faCity },
  { value: 'landmark', icon: icons.faLandmark },
  { value: 'building', icon: icons.faBuilding },
  { value: 'store', icon: icons.faStore },
  { value: 'school', icon: icons.faSchool },
  { value: 'hotel', icon: icons.faHotel },
  { value: 'hospital', icon: icons.faHospital },
  { value: 'church', icon: icons.faChurch },
  { value: 'tree-city', icon: icons.faTreeCity },
  { value: 'tent', icon: icons.faTent },
  { value: 'momument', icon: icons.faMonument },
  { value: 'house-medical', icon: icons.faHouseMedical },
  { value: 'campground', icon: icons.faCampground },
  { value: 'building-columns', icon: icons.faBuildingColumns },
] as const satisfies readonly CategoryIconDef[];
