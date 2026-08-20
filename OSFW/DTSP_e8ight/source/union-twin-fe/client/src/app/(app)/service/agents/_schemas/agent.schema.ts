import { z } from 'zod';

export const agentSchema = z
  .object({
    name: z.string().min(1, 'Agent name is required'),
    type: z.enum(['HTTP', 'HTTPS', 'KAFKA']),
    method: z.enum(['GET', 'POST']),
    isCustomTopic: z.boolean(),
    topic: z.string(),
    urlAddress: z.string().min(1, 'Address is required'),
    connTerm: z.string(),
    sourceTopic: z.string(),
  })
  .superRefine((agent, ctx) => {
    if (agent.isCustomTopic && !agent.topic) {
      ctx.addIssue({ code: 'custom', message: '목적지 Topic은 필수입니다' });
    }
    if (agent.type === 'KAFKA' && !agent.sourceTopic) {
      ctx.addIssue({ code: 'custom', message: 'FDO ID는 필수입니다' });
    }
    if (agent.type !== 'KAFKA' && !agent.connTerm) {
      ctx.addIssue({ code: 'custom', message: 'Connect Term은 필수입니다' });
    }
  });
