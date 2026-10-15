import { z } from 'zod';

export const unionTwinModelSchema = z
  .object({
    federatedTwinId: z.string().min(1, '연합 디지털 트윈을 선택하세요'),
    title: z.string().min(1, 'Title은 필수입니다'),
    subjects: z.array(z.string()).min(1, '주제를 1개 이상 추가하세요'),
    description: z.string().min(1, 'Description은 필수입니다'),
    properties: z
      .array(
        z.object({
          name: z.string().min(1, '이름이 비어 있는 속성이 있습니다'),
          valueType: z.string().min(1, '타입이 비어 있는 속성이 있습니다'),
          title: z.string().optional(),
          provider: z.string().optional(),
          sourceSchema: z.string().optional(),
        }),
      )
      .min(1, '속성을 1개 이상 추가하세요'),
  })
  .superRefine((values, ctx) => {
    const seen = new Set<string>();
    values.properties.forEach((property) => {
      const key = `${property.sourceSchema ?? ''}\u0000${property.name}`;
      if (seen.has(key)) {
        ctx.addIssue({
          code: 'custom',
          path: ['properties'],
          message: `같은 원본 객체 안에 '${property.name}' 속성이 중복되었습니다`,
        });
      }
      seen.add(key);
    });
  });

export type UnionModelFormValues = z.infer<typeof unionTwinModelSchema>;
