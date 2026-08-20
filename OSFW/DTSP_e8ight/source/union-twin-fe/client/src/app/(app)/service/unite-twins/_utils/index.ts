import dayjs from 'dayjs';
import { isNotNil, uniqBy } from 'es-toolkit';

import { ENTITY_ACCESS_BASE_URL } from '@/app/(app)/service/unite-twins/_constants';

import type { CreateFederatedTwinObjectPayload } from '@/apis/dtmeta';
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

export function extractPropertiesFromSchema(
  jsonSchema: UnionSchema,
  sourceId: string,
) {
  if (!jsonSchema.properties) return [];
  return Object.entries(jsonSchema.properties).map(([key, raw]) => {
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

export function resolvePropertyNames(
  values: UnionModelFormValues,
  items: UnionSchemaItem[],
): UnionModelFormValues {
  const duplicated = duplicatePropertyNames(values.properties);
  return {
    ...values,
    properties: values.properties.map((property) => {
      if (!duplicated.has(property.name)) return property;
      const source = items.find((item) => item.id === property.sourceSchema);
      const prefix = source?.name || source?.title || property.sourceSchema;
      return { ...property, name: `${prefix}_${property.name}` };
    }),
  };
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

function toModelType(source: string, fallback: string) {
  const ascii = source.replace(/[^A-Za-z0-9]/g, '');
  const base = ascii || fallback.replace(/[^A-Za-z0-9]/g, '');
  return `${base.charAt(0).toUpperCase()}${base.slice(1)}`;
}

function modelUrn(type: string) {
  return `urn:ngsi-ld:${type}:`;
}

export function buildChildModelPayloads(
  values: UnionModelFormValues,
  items: UnionSchemaItem[],
): DataModelRequestPayload[] {
  const groups = new Map<string, UnionModelFormValues['properties']>();
  values.properties.forEach((property) => {
    const key = property.sourceSchema ?? '';
    const group = groups.get(key) ?? [];
    group.push(property);
    groups.set(key, group);
  });

  return [...groups].map(([sourceSchema, properties]) => {
    const item = items.find((entry) => entry.id === sourceSchema);
    const type = toModelType(item?.name || item?.title || '', sourceSchema);
    const attributeNames: Record<string, string> = {};
    const attributes: Record<string, DataModelAttribute> = {};
    properties.forEach((property) => {
      attributeNames[property.name] = property.name;
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
  values: UnionModelFormValues,
  childModels: DataModelRequestPayload[],
): DataModelRequestPayload {
  const type = toModelType(values.type, values.type);
  return {
    id: modelUrn(type),
    type,
    title: values.title,
    description: values.description,
    attributeNames: { hasTwin: 'hasTwin' },
    attributes: {
      hasTwin: {
        type: 'Relationship',
        valueType: 'String',
        modelType: childModels.map((child) => child.id),
      },
    },
  };
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
  const segments = firstItem?.digitalTwinId?.split('-') ?? [];
  if (!firstItem || segments.length !== 4) {
    throw new Error(
      `선택한 객체의 digitalTwinId(${firstItem?.digitalTwinId ?? '없음'})에서 국가/분류 코드를 추출할 수 없습니다. KR-01-022112-20260012 형식이 필요합니다.`,
    );
  }
  const [
    countryCode,
    objectPrimaryClassificationCode,
    objectSecondaryClassificationCode,
  ] = segments;

  const firstChildType = toModelType(
    firstItem.name || firstItem.title || '',
    firstItem.id,
  );
  const dataAccessURL = `${ENTITY_ACCESS_BASE_URL}/urn:ngsi-ld:${firstChildType}:${firstItem.id}`;

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
              values.properties.map((property) => [
                property.name,
                {
                  type: JSON_SCHEMA_TYPE[property.valueType] ?? 'string',
                  title: property.title,
                  provider: property.provider,
                },
              ]),
            ),
          },
          dataAccessURL,
        },
      },
    ],
  };
}
