'use client';

import { useId } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@e8ight/ui/components/ui/button';
import { openConfirmDialog } from '@e8ight/ui/components/ui/confirm-dialog';
import { Field, FieldError, FieldLabel } from '@e8ight/ui/components/ui/field';
import { Spinner } from '@e8ight/ui/components/ui/spinner';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

import {
  useCreateNoticeMutation,
  useUpdateNoticeMutation,
} from '@/apis/notices';
import { NoticeContentEditor } from '@/app/(app)/noticeboard/_components/NoticeContentEditor';
import {
  NOTICE_TITLE_MAX_LENGTH,
  noticeFormSchema,
} from '@/app/(app)/noticeboard/_schemas/notice.schema';

import type { NoticeFormValues } from '@/app/(app)/noticeboard/_schemas/notice.schema';
import type { Notice } from '@/types/noticeboard';

const MARKDOWN_HINT =
  '마크다운을 지원합니다 — **굵게**, *기울임*, `코드`, # 제목, > 인용, - 목록';

interface NoticeEditorProps {
  notice?: Notice;
}

export function NoticeEditor({ notice }: NoticeEditorProps) {
  const router = useRouter();
  const titleId = useId();
  const contentId = useId();
  const isEditing = !!notice;
  const createMutation = useCreateNoticeMutation();
  const updateMutation = useUpdateNoticeMutation();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isDirty },
  } = useForm<NoticeFormValues>({
    resolver: zodResolver(noticeFormSchema),
    mode: 'onTouched',
    defaultValues: {
      title: notice?.title ?? '',
      content: notice?.content ?? '',
    },
  });

  const titleValue = watch('title');
  const contentValue = watch('content');
  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = handleSubmit((values) => {
    if (isEditing) {
      updateMutation.mutate(
        { id: notice.id, payload: values },
        { onSuccess: () => router.push(`/noticeboard/${notice.id}`) },
      );
    } else {
      createMutation.mutate(values, {
        onSuccess: (res) => router.push(`/noticeboard/${res.id}`),
      });
    }
  });

  async function handleCancel() {
    if (isDirty) {
      const confirmed = await openConfirmDialog({
        title: '작성을 취소하시겠습니까?',
        message: '저장하지 않은 변경 사항은 사라집니다.',
        confirmText: '나가기',
        cancelText: '계속 작성',
      });
      if (!confirmed) return;
    }
    if (isEditing) {
      router.push(`/noticeboard/${notice.id}`);
    } else {
      router.push('/noticeboard');
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex min-h-full flex-col">
      <div className="bg-background/80 sticky top-0 z-20 border-b backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isPending}
          >
            <ArrowLeft className="size-4" />
            취소
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground hidden text-xs sm:inline">
              {isEditing ? '수정 중' : '새 공지사항'}
            </span>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? (
                <Spinner className="size-4" />
              ) : isEditing ? (
                '수정 완료'
              ) : (
                '게시하기'
              )}
            </Button>
          </div>
        </div>
      </div>

      <fieldset
        disabled={isPending}
        className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-8"
      >
        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel
              htmlFor={titleId}
              className="text-muted-foreground text-xs font-medium"
            >
              제목
            </FieldLabel>
            <span className="text-muted-foreground text-xs tabular-nums">
              {titleValue.length} / {NOTICE_TITLE_MAX_LENGTH}
            </span>
          </div>
          <input
            id={titleId}
            type="text"
            placeholder="공지사항 제목을 입력하세요"
            autoFocus
            maxLength={NOTICE_TITLE_MAX_LENGTH}
            aria-invalid={!!errors.title}
            className="text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-ring/50 -mx-2 w-[calc(100%+1rem)] rounded-md border-0 bg-transparent px-2 py-1 text-xl font-semibold outline-none focus-visible:ring-2"
            {...register('title')}
          />
          {errors.title && <FieldError>{errors.title.message}</FieldError>}
        </Field>

        <Field data-color-mode="light">
          <div className="flex items-center justify-between">
            <FieldLabel
              htmlFor={contentId}
              className="text-muted-foreground text-xs font-medium"
            >
              내용
            </FieldLabel>
            <span className="text-muted-foreground text-xs tabular-nums">
              {contentValue.length}자
            </span>
          </div>
          <Controller
            name="content"
            control={control}
            render={({ field }) => (
              <NoticeContentEditor
                textareaId={contentId}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Sparkles className="size-3" />
            {MARKDOWN_HINT}
          </p>
          {errors.content && <FieldError>{errors.content.message}</FieldError>}
        </Field>
      </fieldset>
    </form>
  );
}
