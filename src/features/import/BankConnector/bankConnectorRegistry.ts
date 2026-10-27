import type { BankConnector } from '~/generated/prisma/enums';

import type { IBankConnector } from './BankConnector';
import {
  EnableBankingClient,
  type EnableBankingCredentials,
} from './EnableBankingClient';
import { VividBankConnector } from './VividBankConnector';

const connectors: Record<
  BankConnector,
  (client: EnableBankingClient) => IBankConnector
> = {
  VIVID: (client) => new VividBankConnector(client),
};

export const createBankConnector = (
  connector: BankConnector,
  credentials: EnableBankingCredentials,
): IBankConnector =>
  connectors[connector](new EnableBankingClient(credentials));
