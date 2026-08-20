import type { Dispatch, SetStateAction } from 'react';

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
import { Spinner } from '@e8ight/ui/components/ui/spinner';
import { ErrorBoundary, Suspense } from '@suspensive/react';

import { ContextSelector } from '@/app/(app)/service/contexts/_components/ContextSelector';
import { QueryErrorFallback } from '@/components/common/QueryErrorFallback';

import type { ContextModel } from '@/types/context';

interface ContextDataModelPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contextModelList: ContextModel[];
  setContextModelList: Dispatch<SetStateAction<ContextModel[]>>;
}

export function ContextDataModelPickerDialog({
  open,
  onOpenChange,
  contextModelList,
  setContextModelList,
}: ContextDataModelPickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85svh] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add data models</DialogTitle>
          <DialogDescription>
            Search ready data models and add them to this context.
          </DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
          <ErrorBoundary fallback={<QueryErrorFallback />}>
            <Suspense
              fallback={
                <div className="flex min-h-[11rem] flex-1 items-center justify-center">
                  <Spinner className="text-muted-foreground size-6" />
                </div>
              }
            >
              <ContextSelector
                ContextModelList={contextModelList}
                setContextModelList={setContextModelList}
              />
            </Suspense>
          </ErrorBoundary>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
