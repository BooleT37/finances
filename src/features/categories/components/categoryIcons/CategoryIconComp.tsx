import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { getIconByValue } from './categoryIcons';

interface Props {
  value: string;
}

export function CategoryIconComp({ value }: Props) {
  const foundIcon = getIconByValue(value);
  if (!foundIcon) {
    return null;
  }
  return <FontAwesomeIcon icon={foundIcon} />;
}
