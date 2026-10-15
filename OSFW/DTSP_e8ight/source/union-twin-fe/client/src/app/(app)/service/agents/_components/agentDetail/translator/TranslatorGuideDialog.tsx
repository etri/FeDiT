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

const TRANSLATOR_GUIDE_URL = '/guides/translator-guide.html';

export function openTranslatorGuideDialog() {
  return overlay.openAsync<void>(({ isOpen, close }) => (
    <Dialog open={isOpen} onOpenChange={(v) => !v && close()}>
      <DialogContent className="flex h-[90svh] flex-col p-0 sm:max-w-6xl">
        <DialogHeader className="px-6 pt-6">
          <div className="flex items-center justify-between gap-2 pr-6">
            <DialogTitle>Translator 작성 가이드</DialogTitle>
            <Button asChild variant="outline" size="sm">
              <a href={TRANSLATOR_GUIDE_URL} download="translator-guide.html">
                <Download />
                HTML 다운로드
              </a>
            </Button>
          </div>
          <DialogDescription>
            원천 데이터를 NGSI-LD 엔티티로 변환하는 Translator 코드 작성법을
            정리한 문서입니다.
          </DialogDescription>
        </DialogHeader>
        <iframe
          src={TRANSLATOR_GUIDE_URL}
          title="Translator 작성 가이드"
          className="border-border min-h-0 flex-1 border-t"
        />
      </DialogContent>
    </Dialog>
  ));
}
