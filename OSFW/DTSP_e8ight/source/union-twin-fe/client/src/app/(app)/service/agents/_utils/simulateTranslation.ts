import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';

import type {
  SpecAttribute,
  TranslatorEntitySpec,
  TranslatorSpec,
} from '@/app/(app)/service/agents/_utils/translatorSpec';

dayjs.extend(utc);
dayjs.extend(customParseFormat);

export interface SimulatedAttribute {
  type: 'Property' | 'Relationship';
  value: unknown;
  observedAt?: string;
}

export interface SimulatedEntity {
  id: string;
  type: string;
  servicePath: string;
  attributes: Record<string, SimulatedAttribute>;
}

export interface SimulationResult {
  entities: SimulatedEntity[];
  warnings: string[];
}

type JsonObject = Record<string, unknown>;

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function javaPatternToDayjs(pattern: string) {
  return pattern
    .replace(/'([^']*)'/g, '[$1]')
    .replace(/y/g, 'Y')
    .replace(/d/g, 'D');
}

function coerce(value: unknown, attribute: SpecAttribute) {
  if (attribute.kind === 'Relationship') {
    return `${attribute.targetPrefix}${String(value)}`;
  }
  switch (attribute.valueType) {
    case 'Integer':
      return typeof value === 'number'
        ? Math.trunc(value)
        : Number.parseInt(String(value), 10);
    case 'Double':
      return typeof value === 'number'
        ? value
        : Number.parseFloat(String(value));
    case 'Boolean':
      return typeof value === 'boolean' ? value : String(value) === 'true';
    default:
      return String(value);
  }
}

function resolveObservedAt(
  spec: TranslatorEntitySpec,
  item: JsonObject,
  warnings: string[],
) {
  const { observedAt } = spec;
  if (observedAt.kind === 'none') return undefined;
  if (observedAt.kind === 'now') return dayjs.utc().toISOString();
  const raw = item[observedAt.field];
  if (raw === undefined) {
    warnings.push(`observedAt 원천 필드 '${observedAt.field}'가 없습니다.`);
    return undefined;
  }
  const parsed = dayjs(
    `${String(raw)}${observedAt.offset}`,
    `${javaPatternToDayjs(observedAt.pattern)}Z`,
    true,
  );
  if (!parsed.isValid()) {
    warnings.push(
      `observedAt 값 '${String(raw)}'을 패턴 '${observedAt.pattern}'으로 파싱하지 못했습니다.`,
    );
    return undefined;
  }
  return parsed.utc().toISOString();
}

function collectItems(
  spec: TranslatorEntitySpec,
  sample: unknown,
  warnings: string[],
) {
  if (!isJsonObject(sample)) {
    warnings.push('원천 데이터의 최상위는 JSON 객체여야 합니다.');
    return [];
  }
  if (spec.source.kind === 'object') return [sample];
  const target = sample[spec.source.path];
  if (spec.source.kind === 'array') {
    if (!Array.isArray(target)) {
      warnings.push(`'${spec.source.path}' 경로에 배열이 없습니다.`);
      return [];
    }
    return target.filter(isJsonObject);
  }
  if (!isJsonObject(target)) {
    warnings.push(`'${spec.source.path}' 경로에 객체가 없습니다.`);
    return [];
  }
  return [target];
}

function simulateEntity(
  spec: TranslatorEntitySpec,
  sample: unknown,
  warnings: string[],
) {
  return collectItems(spec, sample, warnings).map((item, index) => {
    const idValue = item[spec.entityId.field];
    if (idValue === undefined) {
      warnings.push(
        `[${index}] Entity ID 원천 필드 '${spec.entityId.field}'가 없습니다.`,
      );
    }
    const observedAt = resolveObservedAt(spec, item, warnings);
    const attributes: Record<string, SimulatedAttribute> = {};
    spec.attributes.forEach((attribute) => {
      const raw = item[attribute.field];
      if (raw === undefined) {
        warnings.push(
          `[${index}] '${attribute.name}' 원천 필드 '${attribute.field}'가 없습니다.`,
        );
      }
      attributes[attribute.name] = {
        type: attribute.kind,
        value: raw === undefined ? null : coerce(raw, attribute),
        ...(observedAt && attribute.kind === 'Property' ? { observedAt } : {}),
      };
    });
    return {
      id: `${spec.entityId.prefix}${idValue === undefined ? '' : String(idValue)}`,
      type: spec.type,
      servicePath: spec.entityId.servicePath,
      attributes,
    };
  });
}

export function simulateTranslation(
  spec: TranslatorSpec,
  sample: unknown,
): SimulationResult {
  const warnings: string[] = [];
  const entities = spec.entities.flatMap((entity) =>
    simulateEntity(entity, sample, warnings),
  );
  return { entities, warnings };
}
