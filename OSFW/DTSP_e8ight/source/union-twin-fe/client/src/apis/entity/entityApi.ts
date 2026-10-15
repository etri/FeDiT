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
  NGSILDType,
} from '@/apis/entity/entity.types';
import type { AxiosResponseHeaders, RawAxiosResponseHeaders } from 'axios';

const BROKER_ENTITIES = `${NDXPRO_API}/broker/entities`;

interface BrokerProvidedEntity {
  provider: string;
  entity: NGSILDType;
}

interface BrokerHistoryItem {
  historyId: string;
  observedAt: string;
  provider: string;
  entity: NGSILDType;
}

function readTotals(headers: RawAxiosResponseHeaders | AxiosResponseHeaders) {
  return {
    totalData: Number(headers.totaldata ?? 0),
    totalPage: Number(headers.totalpage ?? 0),
  };
}

function contextFromLink(link: string) {
  return link.replace(/^<|>$/g, '');
}

export const getEntities = async (
  config: EntitiesRequestType,
): Promise<EntitiesResponseType> => {
  const { data, headers } = await ndxproClient.get<BrokerProvidedEntity[]>(
    `${BROKER_ENTITIES}/provider`,
    { ...config, params: { ...config.params, options: 'count' } },
  );
  return {
    context: contextFromLink(config.headers.Link),
    model: config.params.type,
    entities: data.map(({ provider, entity }) => ({
      provider,
      entityId: entity.id,
    })),
    ...readTotals(headers),
  };
};

export const getEntityDetail = async (
  entityId: string,
  config: EntityDetailRequestType,
): Promise<EntityDetailType> => {
  const { data } = await ndxproClient.get<BrokerProvidedEntity>(
    `${BROKER_ENTITIES}/provider/${encodeURIComponent(entityId)}`,
    config,
  );
  return data;
};

export const getIotEntityHistory = async (
  config: EntityHistoryRequestType,
): Promise<EntityHistoryType> => {
  const { data, headers } = await ndxproClient.get<BrokerHistoryItem[]>(
    `${BROKER_ENTITIES}/iot/history`,
    { ...config, params: { ...config.params, options: 'count' } },
  );
  return {
    context: contextFromLink(config.headers.Link),
    timeproperty: config.params.timeproperty,
    entityHistoryList: data.map(
      ({ historyId, observedAt, provider, entity }) => ({
        entityId: entity.id,
        historyId,
        observedAt,
        provider,
      }),
    ),
    ...readTotals(headers),
  };
};

export const getIotEntityDetail = async (
  historyId: string,
  config: EntityHistoryDetailRequestType,
): Promise<EntityHistoryDetailType> => {
  const { data } = await ndxproClient.get<BrokerHistoryItem>(
    `${BROKER_ENTITIES}/iot/history/${historyId}`,
    config,
  );
  return { ...data, timeproperty: config.params.timeproperty };
};

export const postEntity = async (entity: NGSILDType) => {
  const { data } = await ndxproClient.post(BROKER_ENTITIES, entity);
  return data;
};
