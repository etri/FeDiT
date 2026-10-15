export const SPEC_VALUE_TYPES = [
  'String',
  'Integer',
  'Double',
  'Boolean',
] as const;
export type SpecValueType = (typeof SPEC_VALUE_TYPES)[number];

export const SPEC_SOURCE_KINDS = ['object', 'array', 'nested'] as const;
export type SpecSourceKind = (typeof SPEC_SOURCE_KINDS)[number];

export const SPEC_OBSERVED_AT_KINDS = ['none', 'now', 'field'] as const;
export type SpecObservedAtKind = (typeof SPEC_OBSERVED_AT_KINDS)[number];

export interface SpecAttribute {
  name: string;
  term: string;
  kind: 'Property' | 'Relationship';
  valueType: SpecValueType;
  field: string;
  targetPrefix: string;
}

export interface TranslatorEntitySpec {
  type: string;
  source: { kind: SpecSourceKind; path: string };
  entityId: { prefix: string; field: string; servicePath: string };
  observedAt: {
    kind: SpecObservedAtKind;
    field: string;
    pattern: string;
    offset: string;
  };
  attributes: SpecAttribute[];
}

export interface TranslatorSpec {
  entities: TranslatorEntitySpec[];
}

export const SPEC_MARKER = '//// NOCODE-SPEC ';
export const DEFAULT_SERVICE_PATH = 'FDT';
export const DEFAULT_DATE_PATTERN = "yyyy-MM-dd'T'HH:mm:ss.SSS";
export const DEFAULT_TIME_OFFSET = '+09:00';

export function modelUrnPrefix(type: string) {
  return `urn:ngsi-ld:${type}:`;
}

export function emptyEntitySpec(type: string): TranslatorEntitySpec {
  return {
    type,
    source: { kind: 'object', path: '' },
    entityId: {
      prefix: modelUrnPrefix(type),
      field: '',
      servicePath: DEFAULT_SERVICE_PATH,
    },
    observedAt: {
      kind: 'now',
      field: '',
      pattern: DEFAULT_DATE_PATTERN,
      offset: DEFAULT_TIME_OFFSET,
    },
    attributes: [],
  };
}

const GETTER_VALUE_TYPE: Record<string, SpecValueType> = {
  getInt: 'Integer',
  getLong: 'Integer',
  getString: 'String',
  getBoolean: 'Boolean',
  getDouble: 'Double',
  getNumber: 'Double',
  getFloat: 'Double',
  get: 'String',
};

const GETTER_PATTERN = /\b\w+\.(get\w*)\(\s*"([^"]+)"\s*\)/;

function splitArguments(source: string, openIndex: number) {
  const args: string[] = [];
  let depth = 0;
  let quoted = false;
  let current = '';
  for (let i = openIndex + 1; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      current += char;
      if (char === '\\') {
        current += source[i + 1] ?? '';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
      current += char;
    } else if (char === '(' || char === '{') {
      depth += 1;
      current += char;
    } else if (char === ')' || char === '}') {
      if (depth === 0) {
        args.push(current.trim());
        return args;
      }
      depth -= 1;
      current += char;
    } else if (char === ',' && depth === 0) {
      args.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  return args;
}

function unquote(literal: string) {
  const match = /^"((?:\\.|[^"\\])*)"$/.exec(literal.trim());
  return match ? match[1] : null;
}

function resolveGetter(expression: string, code: string) {
  const direct = GETTER_PATTERN.exec(expression);
  if (direct) {
    return { getter: direct[1], field: direct[2] };
  }
  const identifier = /^[A-Za-z_]\w*$/.exec(expression.trim());
  if (!identifier) return null;
  const assignment = new RegExp(`\\b${identifier[0]}\\s*=\\s*([^;]+);`).exec(
    code,
  );
  if (!assignment) return null;
  const nested = GETTER_PATTERN.exec(assignment[1]);
  return nested ? { getter: nested[1], field: nested[2] } : null;
}

function indexOfAll(code: string, needle: string) {
  const positions: number[] = [];
  let from = 0;
  while (true) {
    const index = code.indexOf(needle, from);
    if (index < 0) return positions;
    positions.push(index);
    from = index + 1;
  }
}

function parseSource(segment: string): TranslatorEntitySpec['source'] {
  const arrayRoot = /\.getJSONArray\(\s*"([^"]+)"\s*\)/.exec(segment);
  if (arrayRoot) return { kind: 'array', path: arrayRoot[1] };
  const nestedRoot = /\.getJSONObject\(\s*"([^"]+)"\s*\)/.exec(segment);
  if (nestedRoot) return { kind: 'nested', path: nestedRoot[1] };
  return { kind: 'object', path: '' };
}

function parseObservedAt(
  segment: string,
  fallback: TranslatorEntitySpec['observedAt'],
): TranslatorEntitySpec['observedAt'] {
  const parsedField =
    /LocalDateTime\s*\.parse\(\s*\w+\.getString\(\s*"([^"]+)"\s*\)\s*,\s*DateTimeFormatter\.ofPattern\(\s*"([^"]+)"\s*\)\s*\)/.exec(
      segment,
    );
  const offset = /ZoneOffset\.of\(\s*"([^"]+)"\s*\)/.exec(segment);
  if (parsedField) {
    return {
      kind: 'field',
      field: parsedField[1],
      pattern: parsedField[2],
      offset: offset?.[1] ?? DEFAULT_TIME_OFFSET,
    };
  }
  if (/ZonedDateTime\.now\(/.test(segment)) return { ...fallback, kind: 'now' };
  return { ...fallback, kind: 'none' };
}

function parseEntitySegment(
  segment: string,
  context: string,
  code: string,
  terms: Map<string, string>,
  fallbackType: string,
  warnings: string[],
): TranslatorEntitySpec {
  const [idExpression, typeLiteral, servicePathLiteral] = splitArguments(
    segment,
    'new EntityId'.length,
  );
  const type = unquote(typeLiteral ?? '') ?? fallbackType;
  const entity = emptyEntitySpec(type);

  const concat = /^"([^"]*)"\s*\+\s*([\s\S]+)$/.exec(idExpression ?? '');
  const idSource = resolveGetter(
    concat ? concat[2] : (idExpression ?? ''),
    code,
  );
  entity.entityId = {
    prefix: concat ? concat[1] : modelUrnPrefix(type),
    field: idSource?.field ?? '',
    servicePath: unquote(servicePathLiteral ?? '') ?? DEFAULT_SERVICE_PATH,
  };
  if (!idSource) {
    warnings.push(`'${type}' 엔티티의 Entity ID 원천 필드를 찾지 못했습니다.`);
  }

  entity.source = parseSource(context);
  entity.observedAt = parseObservedAt(context, entity.observedAt);

  indexOfAll(segment, 'new Attribute(').forEach((start) => {
    const [nameLiteral, kindLiteral, valueExpression] = splitArguments(
      segment,
      start + 'new Attribute'.length,
    );
    const name = unquote(nameLiteral ?? '');
    const kind = unquote(kindLiteral ?? '');
    if (!name || (kind !== 'Property' && kind !== 'Relationship')) return;

    const valueConcat = /^"([^"]*)"\s*\+\s*([\s\S]+)$/.exec(
      valueExpression ?? '',
    );
    const source = resolveGetter(
      valueConcat ? valueConcat[2] : (valueExpression ?? ''),
      code,
    );
    if (!source) {
      warnings.push(
        `'${type}.${name}' 속성의 값 식(${(valueExpression ?? '').trim().slice(0, 40)})은 폼으로 옮기지 못했습니다.`,
      );
      return;
    }
    entity.attributes.push({
      name,
      term: terms.get(name) ?? `e8ight:${name}`,
      kind,
      valueType:
        kind === 'Relationship'
          ? 'String'
          : (GETTER_VALUE_TYPE[source.getter] ?? 'String'),
      field: source.field,
      targetPrefix: kind === 'Relationship' ? (valueConcat?.[1] ?? '') : '',
    });
  });

  return entity;
}

export interface ParsedTranslatorCode {
  spec: TranslatorSpec;
  exact: boolean;
  warnings: string[];
}

export function parseTranslatorCode(
  code: string,
  fallbackType: string,
): ParsedTranslatorCode {
  const markerIndex = code.indexOf(SPEC_MARKER);
  if (markerIndex >= 0) {
    const line = code.slice(markerIndex + SPEC_MARKER.length).split('\n')[0];
    try {
      const spec = JSON.parse(line) as TranslatorSpec;
      if (Array.isArray(spec.entities)) {
        return { spec, exact: true, warnings: [] };
      }
    } catch {
      // fall through to heuristic parsing
    }
  }

  const warnings: string[] = [];
  const terms = new Map<string, string>();
  for (const match of code.matchAll(
    /\w+\.put\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\)/g,
  )) {
    terms.set(match[1], match[2]);
  }

  const starts = indexOfAll(code, 'new EntityId(');
  if (starts.length === 0) {
    warnings.push('new EntityId(...) 구문을 찾지 못했습니다.');
    return {
      spec: { entities: [emptyEntitySpec(fallbackType)] },
      exact: false,
      warnings,
    };
  }

  const entities = starts.map((start, index) => {
    const lead = index === 0 ? 0 : starts[index - 1];
    const end = starts[index + 1] ?? code.length;
    return parseEntitySegment(
      code.slice(start, end),
      code.slice(lead, end),
      code,
      terms,
      fallbackType,
      warnings,
    );
  });

  if (entities.every((entity) => entity.attributes.length === 0)) {
    warnings.push(
      'new Attribute(...) 구문에서 속성 매핑을 하나도 추출하지 못했습니다.',
    );
  }

  return { spec: { entities }, exact: false, warnings };
}
