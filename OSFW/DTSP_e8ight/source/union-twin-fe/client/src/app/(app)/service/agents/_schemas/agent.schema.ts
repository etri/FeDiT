import { z } from 'zod';

const optionalText = z.string().nullish();

export const agentSchema = z
  .object({
    name: z.string().min(1, 'Agent name is required'),
    type: z.enum(['HTTP', 'HTTPS', 'KAFKA'], {
      error: 'Type must be HTTP, HTTPS or KAFKA',
    }),
    method: optionalText,
    isCustomTopic: z.boolean({ error: 'Custom Topic must be true or false' }),
    topic: optionalText,
    urlAddress: z.string().min(1, 'Address is required'),
    connTerm: optionalText,
    sourceTopic: optionalText,
  })
  .superRefine((agent, ctx) => {
    if (agent.isCustomTopic && !agent.topic) {
      ctx.addIssue({
        code: 'custom',
        path: ['topic'],
        message: '목적지 Topic은 필수입니다',
      });
    }
    if (agent.type === 'KAFKA' && !agent.sourceTopic) {
      ctx.addIssue({
        code: 'custom',
        path: ['sourceTopic'],
        message: 'FDO ID는 필수입니다',
      });
    }
    if (agent.type !== 'KAFKA' && !agent.connTerm) {
      ctx.addIssue({
        code: 'custom',
        path: ['connTerm'],
        message: 'Connect Term은 필수입니다',
      });
    }
    if (
      agent.type !== 'KAFKA' &&
      agent.method !== 'GET' &&
      agent.method !== 'POST'
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['method'],
        message: 'Method는 GET 또는 POST여야 합니다',
      });
    }
  });

export function formatAgentIssues(error: z.ZodError) {
  return error.issues
    .map((issue) =>
      issue.path.length
        ? `${issue.path.join('.')} — ${issue.message}`
        : issue.message,
    )
    .join(', ');
}
