import { ndxproClient } from '@/apis/client';

import type {
  CreateFederatedTwinObjectPayload,
  DtmetaResponse,
  FederatedTwinPutResponse,
  FederatedTwinSearchResponse,
  UpdateFederatedTwinObjectSchemaPayload,
} from '@/apis/dtmeta/dtmeta.types';

// ponytail: 연합 트윈은 선택용 목록이라 한 페이지로 받는다. 목록이 커지면 페이징 추가.
const FEDERATED_TWIN_PAGE_SIZE = 100;
// ponytail: 목록 항목당 federatedDigitalTwinObjects 최대 개수. 초과분은 조용히 잘린다.
const FEDERATED_TWIN_OBJECT_LIMIT = 100;

function ensureDtmetaSuccess(response: DtmetaResponse) {
  if (response.responseCode >= 3000) {
    throw new Error(response.responseMsg);
  }
}

export const searchFederatedTwins = async (
  federatedTwinId?: string,
): Promise<FederatedTwinSearchResponse> => {
  const { data } = await ndxproClient.get('/api/meta/digitalTwins/search', {
    params: {
      curPage: 1,
      pageListSize: FEDERATED_TWIN_PAGE_SIZE,
      arrayDataLimit: FEDERATED_TWIN_OBJECT_LIMIT,
      dTw_attr_type: '연합',
      objectRefFormat: 'object',
      dTw_objs_attr: 'federatedDigitalTwinObjects',
      dTw_attr_dtid: federatedTwinId,
    },
  });
  ensureDtmetaSuccess(data);
  return data;
};

export const putFederatedTwinObjects = async ({
  federatedTwinId,
  federatedDigitalTwinObjects,
}:
  | CreateFederatedTwinObjectPayload
  | UpdateFederatedTwinObjectSchemaPayload): Promise<FederatedTwinPutResponse> => {
  const { data } = await ndxproClient.put(
    `/api/meta/digitalTwins/${federatedTwinId}`,
    { federatedDigitalTwinObjects },
  );
  ensureDtmetaSuccess(data);
  return data;
};
