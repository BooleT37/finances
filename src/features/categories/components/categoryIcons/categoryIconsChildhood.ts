import * as icons from '@fortawesome/free-solid-svg-icons';

import type { CategoryIconDef } from './categoryIcons';

export const categoryIconsChildhood = [
  { value: 'gamepad', icon: icons.faGamepad },
  { value: 'child', icon: icons.faChild },
  { value: 'baby', icon: icons.faBaby },
  { value: 'puzzle-piece', icon: icons.faPuzzlePiece },
  { value: 'cake-candles', icon: icons.faCakeCandles },
] as const satisfies readonly CategoryIconDef[];
