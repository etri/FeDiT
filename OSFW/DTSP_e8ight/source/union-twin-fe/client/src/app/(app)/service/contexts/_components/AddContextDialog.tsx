import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@e8ight/ui/components/ui/dialog';
import { overlay } from 'overlay-kit';

import { ContextStructure } from '@/app/(app)/service/contexts/_components/ContextStructure';

function AddContextDialogBody({
  onClose,
}: {
  onClose: (contextId?: string) => void;
}) {
  return (
    <DialogContent className="flex max-h-[85svh] flex-col sm:max-w-5xl">
      <DialogHeader>
        <DialogTitle>Add new context</DialogTitle>
        <DialogDescription>
          Define the context and attach the data models it should include.
        </DialogDescription>
      </DialogHeader>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <ContextStructure
          createMode
          onCreated={(createdContextId) => onClose(createdContextId)}
          onCancelCreate={() => onClose()}
        />
      </div>
    </DialogContent>
  );
}

export function openAddContextDialog() {
  return overlay.openAsync<string | undefined>(({ isOpen, close }) => (
    <Dialog open={isOpen} onOpenChange={(v) => !v && close(undefined)}>
      <AddContextDialogBody onClose={close} />
    </Dialog>
  ));
}
