import { z } from 'zod';

const KAFKA_TOPIC_PATTERN = /^[a-zA-Z0-9._-]{1,249}$/;

const topicFields = {
  sourceTopic: z.string().min(1, 'Source topic is required'),
  targetTopic: z
    .string()
    .refine(
      (value) => value === '' || KAFKA_TOPIC_PATTERN.test(value),
      'Only letters, digits, dot, underscore and hyphen are allowed.',
    ),
};

const hasDistinctTopics = (values: {
  sourceTopic: string;
  targetTopic: string;
}) => values.targetTopic === '' || values.targetTopic !== values.sourceTopic;

const DISTINCT_TOPICS_ERROR = {
  message: 'Target topic must differ from source topic.',
  path: ['targetTopic'],
};

export const translatorCreateSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    modelType: z.string().min(1),
    ...topicFields,
    translateCode: z.string(),
  })
  .refine(hasDistinctTopics, DISTINCT_TOPICS_ERROR);

export const translatorUpdateSchema = z
  .object({
    ...topicFields,
    translateCode: z.string().min(1),
  })
  .refine(hasDistinctTopics, DISTINCT_TOPICS_ERROR);

export type TranslatorCreateFormValues = z.infer<typeof translatorCreateSchema>;
export type TranslatorUpdateFormValues = z.infer<typeof translatorUpdateSchema>;
