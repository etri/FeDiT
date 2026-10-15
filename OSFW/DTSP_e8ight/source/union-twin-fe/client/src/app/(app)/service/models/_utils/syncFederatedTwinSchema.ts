import {
  putFederatedTwinObjects,
  searchFederatedTwins,
} from '@/apis/dtmeta/dtmetaApi';
import { getModel } from '@/apis/model/modelApi';
import { entityAccessUrl } from '@/app/(app)/service/models/_utils/federatedTwinId';

import type { DataModelGetResponse } from '@/apis/model';

const JSON_SCHEMA_TYPE: Record<string, string> = {
  String: 'string',
  Integer: 'integer',
  Double: 'number',
  Boolean: 'boolean',
  Date: 'string',
  Object: 'object',
  ArrayString: 'array',
  ArrayDouble: 'array',
};

export interface FederatedTwinSyncTarget {
  federatedTwinId: string;
  dtoid: string;
}

function toModelId(urn: string) {
  return urn.replace(/^(?:urn:)?ngsi-ld:/, '').replace(/:$/, '');
}

function relatedModelIds(model: DataModelGetResponse) {
  return Object.values(model.attributes).flatMap((attribute) =>
    attribute.type === 'Relationship' && Array.isArray(attribute.modelType)
      ? attribute.modelType.filter(
          (value): value is string => typeof value === 'string',
        )
      : [],
  );
}

function dataAttributeEntries(model: DataModelGetResponse) {
  return Object.entries(model.attributes).filter(
    ([, attribute]) => attribute.type !== 'Relationship',
  );
}

function buildProperties(
  models: DataModelGetResponse[],
  existing: Record<string, unknown>,
) {
  const properties: Record<string, unknown> = {};
  models.forEach((model) => {
    dataAttributeEntries(model).forEach(([name, attribute]) => {
      if (name in properties) return;
      const previous = existing[name] as
        { provider?: string; title?: string } | undefined;
      properties[name] = {
        type: JSON_SCHEMA_TYPE[attribute.valueType] ?? 'string',
        title: previous?.title ?? name,
        provider: previous?.provider ?? '',
      };
    });
  });
  return properties;
}

export async function syncFederatedTwinSchema(
  model: DataModelGetResponse,
  { federatedTwinId, dtoid }: FederatedTwinSyncTarget,
  brokerUrl: string,
) {
  const { responseData } = await searchFederatedTwins(federatedTwinId);
  const object = responseData
    .find((twin) => twin.dtid === federatedTwinId)
    ?.federatedDigitalTwinObjects?.find(
      (candidate) => candidate.dtoid === dtoid,
    );
  if (!object) {
    throw new Error(`Federated object ${dtoid} no longer exists.`);
  }

  const childModels =
    dataAttributeEntries(model).length > 0
      ? []
      : await Promise.all(
          relatedModelIds(model).map((urn) =>
            getModel({ dataModelId: toModelId(urn) }),
          ),
        );
  const properties = buildProperties(
    [model, ...childModels],
    object.digitalTwinObjectData?.schemaInformation?.properties ?? {},
  );
  if (Object.keys(properties).length === 0) {
    throw new Error(
      'This model has no attributes to publish as schemaInformation.',
    );
  }

  await putFederatedTwinObjects({
    federatedTwinId,
    federatedDigitalTwinObjects: [
      {
        dtoid,
        digitalTwinObjectData: {
          ...object.digitalTwinObjectData,
          schemaInformation: { type: 'object', properties },
          dataAccessURL: entityAccessUrl(brokerUrl, model.type, dtoid),
        },
      },
    ],
  });

  return Object.keys(properties).length;
}
