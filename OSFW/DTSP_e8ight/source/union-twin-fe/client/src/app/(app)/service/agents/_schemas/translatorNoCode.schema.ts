import { z } from 'zod';

import {
  SPEC_OBSERVED_AT_KINDS,
  SPEC_SOURCE_KINDS,
  SPEC_VALUE_TYPES,
} from '@/app/(app)/service/agents/_utils/translatorSpec';

const attributeSchema = z.object({
  name: z.string().min(1, '속성 이름이 비어 있습니다'),
  term: z.string().min(1, '컨텍스트 이름이 비어 있습니다'),
  kind: z.enum(['Property', 'Relationship']),
  valueType: z.enum(SPEC_VALUE_TYPES),
  field: z.string().min(1, '원천 필드가 비어 있는 속성이 있습니다'),
  targetPrefix: z.string(),
});

const entitySchema = z
  .object({
    type: z.string().min(1, '엔티티 Type을 입력하세요'),
    source: z.object({
      kind: z.enum(SPEC_SOURCE_KINDS),
      path: z.string(),
    }),
    entityId: z.object({
      prefix: z.string().min(1, 'Entity ID prefix는 필수입니다'),
      field: z.string().min(1, 'Entity ID 원천 필드는 필수입니다'),
      servicePath: z.string().min(1, 'servicePath는 필수입니다'),
    }),
    observedAt: z.object({
      kind: z.enum(SPEC_OBSERVED_AT_KINDS),
      field: z.string(),
      pattern: z.string(),
      offset: z.string(),
    }),
    attributes: z.array(attributeSchema).min(1, '속성을 1개 이상 매핑하세요'),
  })
  .superRefine((values, ctx) => {
    if (values.source.kind !== 'object' && values.source.path.trim() === '') {
      ctx.addIssue({
        code: 'custom',
        path: ['source', 'path'],
        message: '배열/중첩 객체 경로를 입력하세요',
      });
    }
    if (values.observedAt.kind === 'field') {
      if (values.observedAt.field.trim() === '') {
        ctx.addIssue({
          code: 'custom',
          path: ['observedAt', 'field'],
          message: 'observedAt 원천 필드를 입력하세요',
        });
      }
      if (values.observedAt.pattern.trim() === '') {
        ctx.addIssue({
          code: 'custom',
          path: ['observedAt', 'pattern'],
          message: '날짜 패턴을 입력하세요',
        });
      }
    }
    values.attributes.forEach((attribute, index) => {
      if (attribute.kind === 'Relationship' && attribute.targetPrefix === '') {
        ctx.addIssue({
          code: 'custom',
          path: ['attributes', index, 'targetPrefix'],
          message: 'Relationship 대상 URN prefix를 입력하세요',
        });
      }
    });
  });

export const translatorNoCodeSchema = z.object({
  sampleJson: z.string(),
  entities: z.array(entitySchema).min(1, '엔티티를 1개 이상 정의하세요'),
});

export type TranslatorNoCodeFormValues = z.infer<typeof translatorNoCodeSchema>;
export type TranslatorNoCodeEntityValues = z.infer<typeof entitySchema>;
