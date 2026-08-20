import { ndxproClient } from '@/apis/client';
import { NDXPRO_API } from '@/apis/config';

import type {
  TranslatorCompileRequest,
  TranslatorCompileResponse,
  TranslatorControlRequest,
  TranslatorCreateRequest,
  TranslatorsRequestParams,
  TranslatorType,
} from '@/apis/translator/translator.types';
import type { PaginatedResponse } from '@/types/common';

export const postTranslatorCompile = async (
  payload: TranslatorCompileRequest,
): Promise<TranslatorCompileResponse> => {
  const { data } = await ndxproClient.post(
    `${NDXPRO_API}/translator/translators/compile`,
    payload,
  );
  return data;
};

export const createTranslator = async (payload: TranslatorCreateRequest) => {
  const { data } = await ndxproClient.post(
    `${NDXPRO_API}/translator/translators`,
    payload,
  );
  return data;
};

export const getTranslators = async (
  payload: TranslatorsRequestParams,
): Promise<PaginatedResponse<TranslatorType>> => {
  const { data } = await ndxproClient.get(
    `${NDXPRO_API}/translator/translators`,
    {
      params: payload,
    },
  );
  return data;
};

export const patchTranslatorControl = async (
  translatorId: number,
  payload: TranslatorControlRequest,
): Promise<TranslatorType> => {
  const { data } = await ndxproClient.patch(
    `${NDXPRO_API}/translator/translators/${translatorId}`,
    payload,
  );
  return data;
};

export const deleteTranslator = async (translatorId: number) => {
  const { data } = await ndxproClient.delete(
    `${NDXPRO_API}/translator/translators/${translatorId}`,
  );
  return data;
};

export const getTranslatorSample = async (translatorName: string) => {
  const { data } = await ndxproClient.get(
    `${NDXPRO_API}/translator/translators/sample`,
    {
      params: { name: translatorName },
    },
  );
  return data;
};
