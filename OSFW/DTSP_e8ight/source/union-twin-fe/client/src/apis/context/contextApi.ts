import { ndxproClient } from '@/apis/client';
import { NDXPRO_API } from '@/apis/config';

import type { ContextVersion, CreateContextPayload } from '@/types/context';

export async function getContextData(): Promise<string[]> {
  const { data } = await ndxproClient.get<string[]>(
    `${NDXPRO_API}/manager/contexts`,
  );
  return data;
}

export async function getContextVersion(config: {
  params: { contextUrl: string };
}): Promise<ContextVersion[]> {
  const { data } = await ndxproClient.get<ContextVersion[]>(
    `${NDXPRO_API}/manager/contexts/version`,
    config,
  );
  return data;
}

export async function getContextVone(): Promise<ContextVersion[]> {
  const { data } = await ndxproClient.get<ContextVersion[]>(
    `${NDXPRO_API}/manager/context/v1`,
  );
  return data;
}

export async function getContextDetailData(contextUrl: string) {
  const { data } = await ndxproClient.get(`${NDXPRO_API}/manager/context`, {
    params: { contextUrl },
  });
  return data as Record<string, unknown> & {
    '@context'?: Record<string, string>;
  };
}

export async function createContextData(reqBody: CreateContextPayload) {
  const { data } = await ndxproClient.post(
    `${NDXPRO_API}/manager/contexts`,
    reqBody,
  );
  return data;
}

export async function addContextModelData(
  contextUrl: string,
  contextData: string[],
) {
  const { data } = await ndxproClient.put(
    `${NDXPRO_API}/manager/contexts/models/enrollment`,
    contextData,
    { params: { contextUrl } },
  );
  return data;
}

export async function subContextModelData(
  contextUrl: string,
  contextData: string[],
) {
  const { data } = await ndxproClient.put(
    `${NDXPRO_API}/manager/contexts/models/un-enrollment`,
    contextData,
    { params: { contextUrl } },
  );
  return data;
}

export async function deleteContextData(contextUrl: string) {
  const { data } = await ndxproClient.delete(`${NDXPRO_API}/manager/contexts`, {
    params: { contextUrl },
  });
  return data;
}
