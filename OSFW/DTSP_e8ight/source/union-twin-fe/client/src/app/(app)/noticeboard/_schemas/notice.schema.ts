import { z } from 'zod';

export const NOTICE_TITLE_MAX_LENGTH = 100;
export const NOTICE_CONTENT_MAX_LENGTH = 30_000;

export const noticeFormSchema = z.object({
  title: z
    .string()
    .min(1, '제목을 입력해주세요')
    .max(NOTICE_TITLE_MAX_LENGTH, '제목은 100자 이내로 작성해주세요'),
  content: z
    .string()
    .min(1, '내용을 입력해주세요')
    .max(NOTICE_CONTENT_MAX_LENGTH, '내용은 30,000자 이내로 작성해주세요'),
});

export type NoticeFormValues = z.infer<typeof noticeFormSchema>;
