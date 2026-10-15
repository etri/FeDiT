import { Button } from '@e8ight/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@e8ight/ui/components/ui/dialog';
import { Download } from 'lucide-react';
import { overlay } from 'overlay-kit';

const ENTITY_QUERY_GUIDE_URL = '/guides/entity-query-guide.html';

export function openEntityQueryGuideDialog() {
  return overlay.openAsync<void>(({ isOpen, close }) => (
    <Dialog open={isOpen} onOpenChange={(v) => !v && close()}>
      <DialogContent className="flex h-[90svh] flex-col p-0 sm:max-w-6xl">
        <DialogHeader className="px-6 pt-6">
          <div className="flex items-center justify-between gap-2 pr-6">
            <DialogTitle>엔티티 조회 가이드</DialogTitle>
            <Button asChild variant="outline" size="sm">
              <a
                href={ENTITY_QUERY_GUIDE_URL}
                download="entity-query-guide.html"
              >
                <Download />
                HTML 다운로드
              </a>
            </Button>
          </div>
          <DialogDescription>
            브로커 조회 API 사용법(URN 인코딩, Link 헤더, 전체/단건 조회)과 원천
            데이터가 엔티티가 되기까지의 흐름을 정리한 문서입니다.
          </DialogDescription>
        </DialogHeader>
        <iframe
          src={ENTITY_QUERY_GUIDE_URL}
          title="엔티티 조회 가이드"
          className="border-border min-h-0 flex-1 border-t"
        />
      </DialogContent>
    </Dialog>
  ));
}
