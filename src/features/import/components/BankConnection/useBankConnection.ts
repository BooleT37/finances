import { useQuery } from '@tanstack/react-query';

import {
  getBankConnectionsQueryOptions,
  getBankImportAvailableQueryOptions,
} from '~/features/import/queries';

export function useBankImportAvailable() {
  const { data } = useQuery(getBankImportAvailableQueryOptions());
  return data === true;
}

export function useBankConnection(sourceId: number) {
  const bankImportAvailable = useBankImportAvailable();
  const { data: connections } = useQuery({
    ...getBankConnectionsQueryOptions(),
    enabled: bankImportAvailable,
  });
  return (
    connections?.find((connection) => connection.sourceId === sourceId) ?? null
  );
}
