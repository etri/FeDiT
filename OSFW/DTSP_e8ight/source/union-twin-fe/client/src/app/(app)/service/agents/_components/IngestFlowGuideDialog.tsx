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

const INGEST_FLOW_GUIDE_URL = '/guides/ingest-flow-guide.html';

export function openIngestFlowGuideDialog() {
  return overlay.openAsync<void>(({ isOpen, close }) => (
    <Dialog open={isOpen} onOpenChange={(v) => !v && close()}>
      <DialogContent className="flex h-[90svh] flex-col p-0 sm:max-w-6xl">
        <DialogHeader className="px-6 pt-6">
          <div className="flex items-center justify-between gap-2 pr-6">
            <DialogTitle>수집 설정 가이드</DialogTitle>
            <Button asChild variant="outline" size="sm">
              <a href={INGEST_FLOW_GUIDE_URL} download="ingest-flow-guide.html">
                <Download />
                HTML 다운로드
              </a>
            </Button>
          </div>
          <DialogDescription>
            원천 데이터가 Agent · Translator를 거쳐 브로커에 저장되기까지의
            흐름, 토픽 연결 규칙, 작업 순서를 정리한 문서입니다.
          </DialogDescription>
        </DialogHeader>
        <iframe
          src={INGEST_FLOW_GUIDE_URL}
          title="수집 설정 가이드"
          className="border-border min-h-0 flex-1 border-t"
        />
      </DialogContent>
    </Dialog>
  ));
}
