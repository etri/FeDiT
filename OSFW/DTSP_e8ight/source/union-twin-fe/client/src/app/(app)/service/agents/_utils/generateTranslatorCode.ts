import { SPEC_MARKER } from '@/app/(app)/service/agents/_utils/translatorSpec';

import type {
  SpecAttribute,
  SpecValueType,
  TranslatorEntitySpec,
  TranslatorSpec,
} from '@/app/(app)/service/agents/_utils/translatorSpec';

const GETTER_BY_VALUE_TYPE: Record<SpecValueType, string> = {
  String: 'getString',
  Integer: 'getInt',
  Double: 'getDouble',
  Boolean: 'getBoolean',
};

function javaString(value: string) {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function valueExpression(attribute: SpecAttribute, item: string) {
  if (attribute.kind === 'Relationship') {
    return `${javaString(attribute.targetPrefix)} + ${item}.getString(${javaString(attribute.field)})`;
  }
  return `${item}.${GETTER_BY_VALUE_TYPE[attribute.valueType]}(${javaString(attribute.field)})`;
}

function observedAtLines(entity: TranslatorEntitySpec, item: string) {
  if (entity.observedAt.kind === 'none') return [];
  const timeExpression =
    entity.observedAt.kind === 'now'
      ? 'ZonedDateTime.now(ZoneOffset.UTC)'
      : [
          'LocalDateTime',
          `\t\t\t\t.parse(${item}.getString(${javaString(entity.observedAt.field)}),`,
          `\t\t\t\t\tDateTimeFormatter.ofPattern(${javaString(entity.observedAt.pattern)}))`,
          `\t\t\t\t.atZone(ZoneOffset.of(${javaString(entity.observedAt.offset)}))`,
          '\t\t\t\t.withZoneSameInstant(ZoneOffset.UTC)',
        ].join('\n');
  return [
    'LinkedHashMap<String, String> observedAtMdNames = new LinkedHashMap<>();',
    'observedAtMdNames.put("observedAt", "e8ight:observedAt");',
    'List<Attribute> observedAtMd = new ArrayList<>();',
    `ZonedDateTime zonedDateTime = ${timeExpression};`,
    'observedAtMd.add(new Attribute("observedAt", null, zonedDateTime, null, null));',
    '',
  ];
}

function entityLines(entity: TranslatorEntitySpec, item: string) {
  const hasObservedAt = entity.observedAt.kind !== 'none';
  const metadata = (attribute: SpecAttribute) =>
    hasObservedAt && attribute.kind === 'Property'
      ? 'observedAtMdNames, observedAtMd'
      : 'null, null';
  return [
    'EntityId entityId = new EntityId(',
    `\t\t${javaString(entity.entityId.prefix)} + ${item}.get(${javaString(entity.entityId.field)}),`,
    `\t\t${javaString(entity.type)},`,
    `\t\t${javaString(entity.entityId.servicePath)}`,
    ');',
    '',
    ...observedAtLines(entity, item),
    'List<Attribute> attrs = new ArrayList<>();',
    ...entity.attributes.map(
      (attribute) =>
        `attrs.add(new Attribute(${javaString(attribute.name)}, ${javaString(attribute.kind)}, ${valueExpression(attribute, item)}, ${metadata(attribute)}));`,
    ),
    '',
    'entities.add(new Entity(entityId, attrNames, attrs));',
  ];
}

function indent(lines: string[], depth: number) {
  const prefix = '\t'.repeat(depth);
  return lines.map((line) => (line === '' ? '' : `${prefix}${line}`));
}

function entityBlock(entity: TranslatorEntitySpec, index: number) {
  const attrNameLines = [
    'LinkedHashMap<String, String> attrNames = new LinkedHashMap<>();',
    ...entity.attributes.map(
      (attribute) =>
        `attrNames.put(${javaString(attribute.name)}, ${javaString(attribute.term)});`,
    ),
    '',
  ];
  let body: string[];
  switch (entity.source.kind) {
    case 'array':
      body = [
        `JSONArray itemList = jsonObject.getJSONArray(${javaString(entity.source.path)});`,
        'for (int i = 0; i < itemList.length(); i++) {',
        '\tJSONObject item = itemList.getJSONObject(i);',
        '',
        ...indent(entityLines(entity, 'item'), 1),
        '}',
      ];
      break;
    case 'nested':
      body = [
        `JSONObject item = jsonObject.getJSONObject(${javaString(entity.source.path)});`,
        '',
        ...entityLines(entity, 'item'),
      ];
      break;
    default:
      body = entityLines(entity, 'jsonObject');
  }
  return [
    `// ---- entity ${index + 1}: ${entity.type} ----`,
    '{',
    ...indent([...attrNameLines, ...body], 1),
    '}',
  ];
}

export function generateTranslatorCode(
  spec: TranslatorSpec,
  className: string,
) {
  const lines = [
    'package kr.co.e8ight.ndxpro.translatorRunner.translator;',
    '',
    'import kr.co.e8ight.ndxpro.translatorRunner.vo.Attribute;',
    'import kr.co.e8ight.ndxpro.translatorRunner.vo.Entity;',
    'import kr.co.e8ight.ndxpro.translatorRunner.vo.EntityId;',
    'import org.json.JSONArray;',
    'import org.json.JSONObject;',
    'import org.slf4j.Logger;',
    'import org.slf4j.LoggerFactory;',
    '',
    'import java.time.LocalDateTime;',
    'import java.time.ZoneOffset;',
    'import java.time.ZonedDateTime;',
    'import java.time.format.DateTimeFormatter;',
    'import java.util.*;',
    '',
    `public class ${className} extends EntityTranslator {`,
    `\tprivate static final Logger log = LoggerFactory.getLogger(${className}.class);`,
    '',
    `\tpublic ${className}(String modelType) { }`,
    '',
    '\t@Override',
    '\tpublic List<Entity> translate(JSONObject jsonObject) {',
    '\t\tList<Entity> entities = new ArrayList<>();',
    '',
    '\t\t//// 수정 구간 시작',
    `\t\t${SPEC_MARKER}${JSON.stringify(spec)}`,
    '',
    ...spec.entities.flatMap((entity, index) => [
      ...indent(entityBlock(entity, index), 2),
      '',
    ]),
    '\t\t//// 수정 구간 종료',
    '',
    '\t\treturn entities;',
    '\t}',
    '}',
    '',
  ];
  return lines.join('\n');
}
