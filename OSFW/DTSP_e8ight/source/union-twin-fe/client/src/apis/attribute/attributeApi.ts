import { ndxproClient } from '@/apis/client';
import { NDXPRO_API } from '@/apis/config';

import type { AttributePayload } from '@/apis/attribute/attribute.types';
import type { AttributeListItem } from '@/types/attribute';
import type { PaginatedResponse, PaginationParams } from '@/types/common';

export const getAttrData = async (idParam: string) => {
  const { data } = await ndxproClient.get(
    `${NDXPRO_API}/manager/attributes/${idParam}`,
  );
  return data;
};

export const getAllAttrWithPage = async (
  payload: PaginationParams,
): Promise<PaginatedResponse<AttributeListItem>> => {
  const { data } = await ndxproClient.get(`${NDXPRO_API}/manager/attributes`, {
    params: payload,
  });
  return data;
};

export const getUsingDataModel = async (attributeId: string) => {
  const { data } = await ndxproClient.get(
    `${NDXPRO_API}/manager/attributes/usingModel/${attributeId}`,
  );
  return data;
};

export const postAttrData = async (attrJsonData: AttributePayload) => {
  const { data } = await ndxproClient.post(
    `${NDXPRO_API}/manager/attributes`,
    attrJsonData,
  );
  return data;
};

export const putAttrData = async (attrJsonData: AttributePayload) => {
  const { data } = await ndxproClient.put(
    `${NDXPRO_API}/manager/attributes/`,
    attrJsonData,
  );
  return data;
};

export const deleteAttrData = async (attributeId: string) => {
  const { data } = await ndxproClient.delete(
    `${NDXPRO_API}/manager/attributes/${attributeId}`,
  );
  return data;
};
