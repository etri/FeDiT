import { Button } from '@e8ight/ui/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@e8ight/ui/components/ui/dialog';
import Editor from '@monaco-editor/react';

interface CodeViewerPopupProps {
  open: boolean;
  translateCode: string;
  closeCodeViewer: () => void;
}

function CodeViewerPopup({
  open,
  translateCode,
  closeCodeViewer,
}: CodeViewerPopupProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && closeCodeViewer()}>
      <DialogContent className="flex max-h-[85svh] flex-col sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Translate Code</DialogTitle>
          <DialogDescription>
            Review the generated translator code in a read-only editor.
          </DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-auto">
            <Editor
              value={translateCode}
              height="400px"
              language="java"
              className="border-border w-full border"
              options={{ readOnly: true }}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={closeCodeViewer}>
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CodeViewerPopup;
