import type { Bank } from '~/generated/prisma/enums';

import type { IBankConnector } from './BankConnector';
import {
  EnableBankingClient,
  type EnableBankingCredentials,
} from './EnableBankingClient';
import { VividBankConnector } from './VividBankConnector';

const connectors: Partial<
  Record<Bank, (client: EnableBankingClient) => IBankConnector>
> = {
  VIVID: (client) => new VividBankConnector(client),
};

export function createBankConnector(
  bank: Bank,
  credentials: EnableBankingCredentials,
): IBankConnector {
  const createConnector = connectors[bank];
  if (!createConnector) {
    throw new Error(`${bank} has no bank connector`);
  }
  return createConnector(new EnableBankingClient(credentials));
}
