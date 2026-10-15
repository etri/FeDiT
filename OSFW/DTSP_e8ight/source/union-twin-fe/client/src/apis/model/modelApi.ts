import { ndxproClient } from '@/apis/client';
import { NDXPRO_API } from '@/apis/config';

import type {
  DataModelGetResponse,
  DataModelRequestPayload,
  DataModelVersionUpPayload,
} from '@/apis/model/model.types';
import type { PaginationParams } from '@/types/common';

export const getUnitCodeGroup = async () => {
  const { data } = await ndxproClient.get(`${NDXPRO_API}/manager/unit-code/`);
  return data;
};

export const getUnitCode = async (group?: string) => {
  const { data } = await ndxproClient.get(
    `${NDXPRO_API}/manager/unit-code/${group}`,
  );
  return data;
};

export const getAllModelWithPage = async (payload: PaginationParams) => {
  const { data } = await ndxproClient.get(`${NDXPRO_API}/manager/data-models`, {
    params: payload,
  });
  return data;
};

export const getModel = async ({
  dataModelId,
}: {
  dataModelId: string | undefined;
}): Promise<DataModelGetResponse> => {
  const { data } = await ndxproClient.get(
    `${NDXPRO_API}/manager/data-models/${dataModelId}`,
  );
  return data;
};

export const postModelData = async (modelData: DataModelRequestPayload) => {
  const { data } = await ndxproClient.post(
    `${NDXPRO_API}/manager/data-models`,
    modelData,
  );
  return data;
};

export const putModel = async (attrJsonData: DataModelRequestPayload) => {
  const { data } = await ndxproClient.put(
    `${NDXPRO_API}/manager/data-models/`,
    attrJsonData,
  );
  return data;
};

export const deleteModel = async (dataModelId: string) => {
  const { data } = await ndxproClient.delete(
    `${NDXPRO_API}/manager/data-models/${dataModelId}`,
  );
  return data;
};

export const postModelVersionUp = async (
  payload: DataModelVersionUpPayload,
) => {
  const { data } = await ndxproClient.post(
    `${NDXPRO_API}/manager/data-models/version`,
    payload,
  );
  return data;
};

export const putIsReady = async (dataModelId: string) => {
  const { data } = await ndxproClient.put(
    `${NDXPRO_API}/manager/data-models/readiness/${dataModelId}`,
  );
  return data;
};
