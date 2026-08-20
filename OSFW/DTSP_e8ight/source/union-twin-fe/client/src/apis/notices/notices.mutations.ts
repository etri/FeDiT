import { toast } from '@e8ight/ui/components/ui/sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { noticeKeys } from '@/apis/notices/notices.queries';
import {
  createNotice,
  deleteNotice,
  pinNotice,
  publishNotice,
  updateNotice,
} from '@/apis/notices/noticesApi';

import type {
  CreateNoticePayload,
  UpdateNoticePayload,
} from '@/types/noticeboard';

function useInvalidateNotices() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: noticeKeys.all });
}

export function useCreateNoticeMutation() {
  const invalidate = useInvalidateNotices();

  return useMutation({
    mutationFn: (payload: CreateNoticePayload) => createNotice(payload),
    onSuccess: () => {
      invalidate();
      toast.success('게시글이 생성되었습니다');
    },
    onError: () => {
      toast.error('게시글 생성에 실패했습니다');
    },
  });
}

export function useUpdateNoticeMutation() {
  const invalidate = useInvalidateNotices();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateNoticePayload;
    }) => updateNotice(id, payload),
    onSuccess: () => {
      invalidate();
      toast.success('게시글이 수정되었습니다');
    },
    onError: () => {
      toast.error('게시글 수정에 실패했습니다');
    },
  });
}

export function useDeleteNoticeMutation() {
  const invalidate = useInvalidateNotices();

  return useMutation({
    mutationFn: deleteNotice,
    onSuccess: () => {
      invalidate();
      toast.success('게시글이 삭제되었습니다');
    },
    onError: () => {
      toast.error('게시글 삭제에 실패했습니다');
    },
  });
}

export function usePublishNoticeMutation() {
  const invalidate = useInvalidateNotices();

  return useMutation({
    mutationFn: publishNotice,
    onSuccess: () => {
      invalidate();
      toast.success('게시글 공개 상태가 변경되었습니다');
    },
    onError: () => {
      toast.error('공개 상태 변경에 실패했습니다');
    },
  });
}

export function usePinNoticeMutation() {
  const invalidate = useInvalidateNotices();

  return useMutation({
    mutationFn: pinNotice,
    onSuccess: () => {
      invalidate();
      toast.success('고정 상태가 변경되었습니다');
    },
    onError: () => {
      toast.error('고정 상태 변경에 실패했습니다');
    },
  });
}
