import * as icons from '@fortawesome/free-solid-svg-icons';

import type { CategoryIcon } from './categoryIcons';

export const categoryIconsAccessibility: CategoryIcon[] = [
  { value: 'circle-info', label: 'Информация', icon: icons.faInfoCircle },
  { value: 'eye', label: 'Глаз', icon: icons.faEye },
  { value: 'question', label: 'Вопрос', icon: icons.faQuestion },
  { value: 'phone-volume', label: 'Телефон', icon: icons.faPhoneVolume },
  {
    value: 'person-cane',
    label: 'Человек с тростью',
    icon: icons.faPersonCane,
  },
  { value: 'circle-question', label: 'Вопрос', icon: icons.faCircleQuestion },
];
