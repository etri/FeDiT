import { z } from 'zod';

const NUMBER_VALUE_TYPES = ['Integer', 'Double'];
const JSON_VALUE_TYPES = [
  'Object',
  'ArrayString',
  'ArrayInteger',
  'ArrayDouble',
  'ArrayBoolean',
  'ArrayObject',
];

const attributeInputSchema = z.object({
  name: z.string(),
  type: z.string(),
  valueType: z.string(),
  required: z.boolean(),
  enabled: z.boolean(),
  value: z.string(),
  targets: z.array(z.string()),
});

export const entityCreateSchema = z
  .object({
    idSuffix: z
      .string()
      .trim()
      .min(1, 'Entity ID를 입력하세요')
      .regex(/^[^\s]+$/, '공백은 사용할 수 없습니다'),
    attributes: z.array(attributeInputSchema),
  })
  .superRefine((values, ctx) => {
    values.attributes.forEach((attribute, index) => {
      const path = (field: 'enabled' | 'value' | 'targets') => [
        'attributes',
        index,
        field,
      ];
      if (attribute.required && !attribute.enabled) {
        ctx.addIssue({
          code: 'custom',
          path: path('enabled'),
          message: '필수 속성입니다',
        });
        return;
      }
      if (!attribute.enabled) return;

      if (attribute.type === 'Relationship') {
        if (attribute.targets.length === 0) {
          ctx.addIssue({
            code: 'custom',
            path: path('targets'),
            message: '대상 엔티티를 1개 이상 선택하세요',
          });
        }
        return;
      }

      const raw = attribute.value.trim();
      if (raw === '') {
        ctx.addIssue({
          code: 'custom',
          path: path('value'),
          message: '값을 입력하세요',
        });
        return;
      }
      if (
        attribute.type === 'GeoProperty' ||
        JSON_VALUE_TYPES.includes(attribute.valueType)
      ) {
        try {
          JSON.parse(raw);
        } catch {
          ctx.addIssue({
            code: 'custom',
            path: path('value'),
            message: '올바른 JSON이 아닙니다',
          });
        }
        return;
      }
      if (
        NUMBER_VALUE_TYPES.includes(attribute.valueType) &&
        Number.isNaN(Number(raw))
      ) {
        ctx.addIssue({
          code: 'custom',
          path: path('value'),
          message: '숫자를 입력하세요',
        });
      }
    });
  });

export type EntityCreateFormValues = z.infer<typeof entityCreateSchema>;
export type EntityAttributeInputValues = z.infer<typeof attributeInputSchema>;
