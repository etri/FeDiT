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

const DATA_MODEL_GUIDE_URL = '/guides/data-model-guide.html';

export function openDataModelGuideDialog() {
  return overlay.openAsync<void>(({ isOpen, close }) => (
    <Dialog open={isOpen} onOpenChange={(v) => !v && close()}>
      <DialogContent className="flex h-[90svh] flex-col p-0 sm:max-w-6xl">
        <DialogHeader className="px-6 pt-6">
          <div className="flex items-center justify-between gap-2 pr-6">
            <DialogTitle>데이터 모델링 가이드</DialogTitle>
            <Button asChild variant="outline" size="sm">
              <a href={DATA_MODEL_GUIDE_URL} download="data-model-guide.html">
                <Download />
                HTML 다운로드
              </a>
            </Button>
          </div>
          <DialogDescription>
            일반 값 · 시계열(observedAt) · 관계(Relationship) ·
            위치(GeoProperty) 속성을 모델에 정의하는 방법과 Translator · 조회
            연결을 정리한 문서입니다.
          </DialogDescription>
        </DialogHeader>
        <iframe
          src={DATA_MODEL_GUIDE_URL}
          title="데이터 모델링 가이드"
          className="border-border min-h-0 flex-1 border-t"
        />
      </DialogContent>
    </Dialog>
  ));
}
