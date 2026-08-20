import {
  putFederatedTwinObjects,
  searchFederatedTwins,
} from '@/apis/dtmeta/dtmetaApi';
import { getModel } from '@/apis/model/modelApi';

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
  return urn.replace(/^urn:ngsi-ld:/, '').replace(/:$/, '');
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

function buildProperties(
  models: DataModelGetResponse[],
  existing: Record<string, unknown>,
) {
  const entries = models.flatMap((model) =>
    Object.entries(model.attributes)
      .filter(([, attribute]) => attribute.type !== 'Relationship')
      .map(([name, attribute]) => ({
        name,
        source: model.title || model.type,
        title: model.attributeNames[name] ?? name,
        type: JSON_SCHEMA_TYPE[attribute.valueType] ?? 'string',
      })),
  );

  const names = entries.map((entry) => entry.name);
  const duplicated = new Set(
    names.filter((name, index) => names.indexOf(name) !== index),
  );

  return Object.fromEntries(
    entries.map((entry) => {
      const name = duplicated.has(entry.name)
        ? `${entry.source}_${entry.name}`
        : entry.name;
      const previous = existing[name] as { provider?: string } | undefined;
      return [
        name,
        {
          type: entry.type,
          title: entry.title,
          provider: previous?.provider ?? '',
        },
      ];
    }),
  );
}

export async function syncFederatedTwinSchema(
  model: DataModelGetResponse,
  { federatedTwinId, dtoid }: FederatedTwinSyncTarget,
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

  const childModels = await Promise.all(
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
        },
      },
    ],
  });

  return Object.keys(properties).length;
}
