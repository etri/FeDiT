import { ndxproClient } from '@/apis/client';

import type {
  SyncFederatedObject,
  SyncFederatedTwin,
} from '@/apis/fdtSync/fdtSync.types';

export const getSyncFederatedTwins = async (): Promise<SyncFederatedTwin[]> => {
  const { data } = await ndxproClient.get('/api/fedit/v1/federated-twins');
  return data;
};

export const getSyncFederatedObjects = async (
  federatedTwinId: string,
): Promise<SyncFederatedObject[]> => {
  const { data } = await ndxproClient.get(
    `/api/fedit/v1/federated-twins/${federatedTwinId}/federated-digital-objects`,
  );
  return data;
};
