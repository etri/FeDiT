import type { NGSILDType } from '@/apis/entity';
import type {
  EntityAttributeInputValues,
  EntityCreateFormValues,
} from '@/app/(app)/service/entities/_schemas/entityCreate.schema';

export function entityIdPrefix(modelType: string) {
  return `urn:ngsi-ld:${modelType}:`;
}

export function modelUrnToType(modelUrn: string) {
  return modelUrn.replace(/^urn:ngsi-ld:/, '').replace(/:$/, '');
}

function attributeValue(attribute: EntityAttributeInputValues): unknown {
  const raw = attribute.value.trim();
  switch (attribute.valueType) {
    case 'Integer':
      return Math.trunc(Number(raw));
    case 'Double':
      return Number(raw);
    case 'Boolean':
      return raw === 'true';
    case 'String':
    case 'Date':
      return raw;
    default:
      return JSON.parse(raw) as unknown;
  }
}

function attributeNode(attribute: EntityAttributeInputValues) {
  if (attribute.type === 'Relationship') {
    return {
      type: 'Relationship',
      object:
        attribute.targets.length === 1
          ? attribute.targets[0]
          : attribute.targets,
    };
  }
  if (attribute.type === 'GeoProperty') {
    return { type: 'GeoProperty', value: JSON.parse(attribute.value) };
  }
  return { type: 'Property', value: attributeValue(attribute) };
}

export function buildEntityPayload(
  values: EntityCreateFormValues,
  modelType: string,
  contextId: string,
): NGSILDType {
  const entity: NGSILDType = {
    id: `${entityIdPrefix(modelType)}${values.idSuffix.trim()}`,
    type: modelType,
    '@context': contextId,
  };
  values.attributes
    .filter((attribute) => attribute.enabled)
    .forEach((attribute) => {
      entity[attribute.name] = attributeNode(attribute);
    });
  return entity;
}
