import { SPEC_VALUE_TYPES } from '@/app/(app)/service/agents/_utils/translatorSpec';

import type { DataModelGetResponse } from '@/apis/model';
import type {
  SpecAttribute,
  SpecValueType,
} from '@/app/(app)/service/agents/_utils/translatorSpec';

function toSpecValueType(valueType: string): SpecValueType {
  return (
    SPEC_VALUE_TYPES.find((candidate) => candidate === valueType) ?? 'String'
  );
}

export function modelAttributesToSpec(
  model: DataModelGetResponse,
): SpecAttribute[] {
  return Object.entries(model.attributes).map(([name, attribute]) => ({
    name,
    term: model.attributeNames[name] ?? `e8ight:${name}`,
    kind: attribute.type === 'Relationship' ? 'Relationship' : 'Property',
    valueType: toSpecValueType(attribute.valueType),
    field: name,
    targetPrefix: '',
  }));
}
