import dayjs from 'dayjs';
import { isNotNil, uniqBy } from 'es-toolkit';

import { FEDERATED_REQUIRED_ATTRIBUTES } from '@/app/(app)/service/unite-twins/_constants';

import type {
  CreateFederatedTwinObjectPayload,
  FederatedTwinPutResponse,
} from '@/apis/dtmeta';
import type { DataModelAttribute, DataModelRequestPayload } from '@/apis/model';
import type { VALUE_TYPES } from '@/app/(app)/service/unite-twins/_constants';
import type { UnionModelFormValues } from '@/app/(app)/service/unite-twins/_schemas/union-model.schema';
import type {
  UnionSchema,
  UnionSchemaItem,
} from '@/app/(app)/service/unite-twins/_types/unionSchema';

interface RawSchemaProperty {
  type?: string;
  items?: { type?: string };
  title?: string;
  provider?: string;
}

const ENTITY_MEMBER_PROPERTIES = new Set(['id', 'type']);

function isAttributeProperty(key: string) {
  return !key.startsWith('@') && !ENTITY_MEMBER_PROPERTIES.has(key);
}

export function extractPropertiesFromSchema(
  jsonSchema: UnionSchema,
  sourceId: string,
) {
  if (!jsonSchema.properties) return [];
  return Object.entries(jsonSchema.properties)
    .filter(([key]) => isAttributeProperty(key))
    .map(([key, raw]) => {
      const value = raw as RawSchemaProperty;
      let valueType = 'String';
      if (value.type === 'number' || value.type === 'integer')
        valueType = 'Double';
      else if (value.type === 'boolean') valueType = 'Boolean';
      else if (value.type === 'array')
        valueType =
          value.items?.type === 'string' ? 'ArrayString' : 'ArrayDouble';
      else if (value.type === 'object') valueType = 'Object';
      return {
        name: key,
        valueType,
        title: value.title || key,
        provider: value.provider || '',
        sourceSchema: sourceId,
      };
    });
}

export function duplicatePropertyNames(
  properties: UnionModelFormValues['properties'],
) {
  const names = properties.map((property) => property.name);
  return new Set(
    names.filter((name, index) => name && names.indexOf(name) !== index),
  );
}

function uniqueProperties(properties: UnionModelFormValues['properties']) {
  return uniqBy(properties, (property) => property.name);
}

const JSON_SCHEMA_TYPE: Record<string, string> = {
  String: 'string',
  Integer: 'integer',
  Double: 'number',
  Boolean: 'boolean',
  Date: 'string',
  Object: 'object',
  ArrayString: 'array',
  ArrayDouble: 'array',
} satisfies Record<(typeof VALUE_TYPES)[number], string>;

export function dtoidToModelType(dtoid: string) {
  return dtoid.replace(/-/g, '');
}

function sourceModelTypes(items: UnionSchemaItem[]) {
  return Object.fromEntries(
    items.map((item) => [item.id, dtoidToModelType(item.id)]),
  );
}

function modelUrn(type: string) {
  return `urn:ngsi-ld:${type}:`;
}

const DEFAULT_ATTRIBUTE_NAMESPACE = 'e8ight';

function attributeTerm(name: string, namespaces: Record<string, string>) {
  return `${namespaces[name] ?? DEFAULT_ATTRIBUTE_NAMESPACE}:${name}`;
}

export function buildChildModelPayloads(
  values: UnionModelFormValues,
  items: UnionSchemaItem[],
  namespaces: Record<string, string>,
): DataModelRequestPayload[] {
  const groups = new Map<string, UnionModelFormValues['properties']>();
  values.properties.forEach((property) => {
    const key = property.sourceSchema ?? '';
    const group = groups.get(key) ?? [];
    group.push(property);
    groups.set(key, group);
  });

  const types = sourceModelTypes(items);

  return [...groups].map(([sourceSchema, properties]) => {
    const item = items.find((entry) => entry.id === sourceSchema);
    const type = types[sourceSchema] ?? dtoidToModelType(sourceSchema);
    const attributeNames: Record<string, string> = {};
    const attributes: Record<string, DataModelAttribute> = {};
    properties.forEach((property) => {
      attributeNames[property.name] = attributeTerm(property.name, namespaces);
      attributes[property.name] = {
        type: 'Property',
        valueType: property.valueType,
      };
    });
    return {
      id: modelUrn(type),
      type,
      title: item?.title || item?.name || type,
      attributeNames,
      attributes,
    };
  });
}

export function buildUnionParentModelPayload(
  dtoid: string,
  values: UnionModelFormValues,
  childModels: DataModelRequestPayload[],
  namespaces: Record<string, string>,
): DataModelRequestPayload {
  const type = dtoidToModelType(dtoid);
  const attributeNames: Record<string, string> = {};
  const attributes: Record<string, DataModelAttribute> = {};

  Object.entries(FEDERATED_REQUIRED_ATTRIBUTES).forEach(
    ([name, { valueType, description }]) => {
      attributeNames[name] = attributeTerm(name, namespaces);
      attributes[name] = { type: 'Property', valueType, description };
    },
  );
  uniqueProperties(values.properties).forEach((property) => {
    attributeNames[property.name] = attributeTerm(property.name, namespaces);
    attributes[property.name] = {
      type: 'Property',
      valueType: property.valueType,
    };
  });
  attributeNames.hasTwin = attributeTerm('hasTwin', namespaces);
  attributes.hasTwin = {
    type: 'Relationship',
    valueType: 'String',
    modelType: childModels.map((child) => child.id),
  };

  return {
    id: modelUrn(type),
    type,
    title: values.title,
    description: values.description,
    attributeNames,
    attributes,
  };
}

export function extractCreatedDtoid(response: FederatedTwinPutResponse) {
  const dtoid = response.responseData
    ?.flatMap((twin) => twin.etcInfo ?? [])
    .flatMap(
      (info) => info.outputData?.relatedIds?.federatedDigitalTwinObjects ?? [],
    )
    .find((value) => value.length > 0);
  if (!dtoid) {
    throw new Error(
      '연합 객체(KETI)는 등록되었지만 응답에서 객체 ID(dtoid)를 찾지 못했습니다.',
    );
  }
  return dtoid;
}

export function buildFederatedTwinPayload(
  values: UnionModelFormValues,
  items: UnionSchemaItem[],
): CreateFederatedTwinObjectPayload {
  const sourceItems = uniqBy(
    values.properties
      .map((property) =>
        items.find((item) => item.id === property.sourceSchema),
      )
      .filter(isNotNil),
    (item) => item.id,
  );

  const relatedDigitalTwinObjects = sourceItems.map((item) => item.id);

  const [firstItem] = sourceItems;
  const segments = firstItem?.id.split('-') ?? [];
  if (!firstItem || segments.length !== 3 || segments[1].length !== 6) {
    throw new Error(
      `선택한 객체의 ID(${firstItem?.id ?? '없음'})에서 국가/분류 코드를 추출할 수 없습니다. KR-104111-0024 형식이 필요합니다.`,
    );
  }
  const [countryCode, classificationCode] = segments;
  const objectPrimaryClassificationCode = classificationCode.slice(0, 1);
  const objectSecondaryClassificationCode = classificationCode.slice(1);

  return {
    federatedTwinId: values.federatedTwinId,
    federatedDigitalTwinObjects: [
      {
        name: values.title,
        subjects: values.subjects,
        description: values.description,
        creationTime: dayjs().format(),
        countryCode,
        objectPrimaryClassificationCode,
        objectSecondaryClassificationCode,
        relatedDigitalTwinObjects,
        digitalTwinObjectData: {
          schemaInformation: {
            type: 'object',
            properties: Object.fromEntries(
              uniqueProperties(values.properties).map((property) => [
                property.name,
                {
                  type: JSON_SCHEMA_TYPE[property.valueType] ?? 'string',
                  title: property.title,
                  provider: property.provider,
                },
              ]),
            ),
          },
        },
      },
    ],
  };
}
