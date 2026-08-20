import { ndxproClient } from '@/apis/client';
import { NDXPRO_API } from '@/apis/config';

import type {
  AttributeSchemaDetail,
  CreateAttributeSchemaPayload,
  UpdateAttributeSchemaPayload,
} from '@/apis/attributeSchema/attributeSchema.types';

export const getAttributeAtAttributeSchema = async (
  attributeSchemaId: string,
): Promise<AttributeSchemaDetail> => {
  const { data } = await ndxproClient.get(
    `${NDXPRO_API}/manager/attribute-schemata/${attributeSchemaId}`,
  );
  return data;
};

export const getAttributeSchemaList = async (): Promise<string[]> => {
  const { data } = await ndxproClient.get(
    `${NDXPRO_API}/manager/attribute-schemata`,
  );
  return data;
};

export const createAttributeSchema = async ({
  reqBody,
}: CreateAttributeSchemaPayload) => {
  const { data } = await ndxproClient.post(
    `${NDXPRO_API}/manager/attribute-schemata`,
    reqBody,
  );
  return data;
};

export const updateAttributeSchema = async (
  reqBody: UpdateAttributeSchemaPayload,
) => {
  const { data } = await ndxproClient.put(
    `${NDXPRO_API}/manager/attribute-schemata`,
    reqBody,
  );
  return data;
};
