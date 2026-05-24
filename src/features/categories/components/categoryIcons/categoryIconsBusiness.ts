import * as icons from '@fortawesome/free-solid-svg-icons';

import type { CategoryIconDef } from './categoryIcons';

export const categoryIconsBusiness = [
  { value: 'phone', icon: icons.faPhone },
  { value: 'envelope', icon: icons.faEnvelope },
  { value: 'paperclip', icon: icons.faPaperclip },
  { value: 'pen', icon: icons.faPen },
  { value: 'briefcase', icon: icons.faBriefcase },
  { value: 'wallet', icon: icons.faWallet },
  { value: 'percent', icon: icons.faPercent },
  { value: 'glasses', icon: icons.faGlasses },
  { value: 'credit-card', icon: icons.faCreditCard },
  { value: 'coins', icon: icons.faCoins },
  { value: 'receipt', icon: icons.faReceipt },
  { value: 'money-bills', icon: icons.faMoneyBills },
] as const satisfies readonly CategoryIconDef[];
