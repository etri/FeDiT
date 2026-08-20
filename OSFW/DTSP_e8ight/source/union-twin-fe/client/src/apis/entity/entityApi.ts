import { ndxproClient } from '@/apis/client';
import { NDXPRO_API } from '@/apis/config';

import type {
  EntitiesRequestType,
  EntitiesResponseType,
  EntityDetailRequestType,
  EntityDetailType,
  EntityHistoryDetailRequestType,
  EntityHistoryDetailType,
  EntityHistoryRequestType,
  EntityHistoryType,
} from '@/apis/entity/entity.types';

export const getEntities = async (
  config: EntitiesRequestType,
): Promise<EntitiesResponseType> => {
  const { data } = await ndxproClient.get(
    `${NDXPRO_API}/service/entities`,
    config,
  );
  return data;
};

export const getEntityDetail = async (
  entityId: string,
  config: EntityDetailRequestType,
): Promise<EntityDetailType> => {
  const { data } = await ndxproClient.get(
    `${NDXPRO_API}/service/entities/${entityId}`,
    config,
  );
  return data;
};

export const getIotEntities = async (
  config: EntitiesRequestType,
): Promise<EntitiesResponseType> => {
  const { data } = await ndxproClient.get(
    `${NDXPRO_API}/service/entities/iot`,
    config,
  );
  return data;
};

export const getIotEntityHistory = async (
  config: EntityHistoryRequestType,
): Promise<EntityHistoryType> => {
  const { data } = await ndxproClient.get(
    `${NDXPRO_API}/service/entities/iot/history`,
    config,
  );
  return data;
};

export const getIotEntityDetail = async (
  historyId: string,
  config: EntityHistoryDetailRequestType,
): Promise<EntityHistoryDetailType> => {
  const { data } = await ndxproClient.get(
    `${NDXPRO_API}/service/entities/iot/history/${historyId}`,
    config,
  );
  return data;
};
