import { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';

import {
  Alert,
  AlertAction,
  AlertDescription,
} from '@e8ight/ui/components/ui/alert';
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
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@e8ight/ui/components/ui/resizable';
import { ScrollArea } from '@e8ight/ui/components/ui/scroll-area';
import { toast } from '@e8ight/ui/components/ui/sonner';
import { useIsMobile } from '@e8ight/ui/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, X } from 'lucide-react';
import { overlay } from 'overlay-kit';

import DataModelAttribute from '@/app/(app)/service/models/_components/dataModelDetail/DataModelAttribute';
import DataModelInfo from '@/app/(app)/service/models/_components/dataModelDetail/DataModelInfo';
import DataModelTree from '@/app/(app)/service/models/_components/dataModelTree/DataModelTree';
import { useModel } from '@/app/(app)/service/models/_hooks/useModel';
import {
  dataModelSchema,
  type DataModelFormValues,
} from '@/app/(app)/service/models/_schemas/dataModel.schema';
import { useDataModelStore } from '@/app/(app)/service/models/_stores/useDataModelStore';

function AddDataModelEditor({
  errorMessage,
  onClearError,
}: {
  errorMessage: string;
  onClearError: () => void;
}) {
  const modelSelected = useDataModelStore((s) => s.modelSelected);
  const setModelSelected = useDataModelStore((s) => s.setModelSelected);
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <ResizablePanelGroup
        direction={isMobile ? 'vertical' : 'horizontal'}
        className="min-h-0 flex-1"
      >
        <ResizablePanel defaultSize={25} minSize={15}>
          <ScrollArea className="h-full">
            <div className="space-y-4 px-1 pr-4 pb-4">
              {errorMessage !== '' && (
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                  <AlertAction>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={onClearError}
                    >
                      <X className="size-4" />
                    </Button>
                  </AlertAction>
                </Alert>
              )}
              <DataModelInfo EditableType />
            </div>
          </ScrollArea>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={75}>
          <div className="flex h-full min-w-0 flex-col gap-4 overflow-hidden pl-4 md:flex-row">
            <DataModelTree />
            {modelSelected.length !== 0 && (
              <DataModelAttribute
                parentId={modelSelected[0]}
                id={modelSelected[1]}
                onClose={() => setModelSelected([])}
              />
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function AddDataModelDialogBody({
  onClose,
}: {
  onClose: (result?: string) => void;
}) {
  const resetDataModel = useDataModelStore((s) => s.resetDataModel);
  const setEditMode = useDataModelStore((s) => s.setEditMode);

  useEffect(() => {
    resetDataModel();
    setEditMode(true);
  }, [resetDataModel, setEditMode]);

  const [errorMessage, setErrorMessage] = useState('');
  const { create, isCreating } = useModel({ onCreated: onClose });

  const methods = useForm<DataModelFormValues>({
    resolver: zodResolver(dataModelSchema),
    defaultValues: {
      id: '',
      type: '',
      title: '',
      description: '',
      reference: [],
    },
  });

  const onSubmit = async (values: DataModelFormValues) => {
    const result = await create(values);
    if (!result.ok) {
      setErrorMessage(result.message);
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={methods.handleSubmit(onSubmit, () =>
          toast.error('Please check the form fields.'),
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <AddDataModelEditor
            errorMessage={errorMessage}
            onClearError={() => setErrorMessage('')}
          />
        </div>
        <DialogFooter className="shrink-0">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose()}
              disabled={isCreating}
            >
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </form>
    </FormProvider>
  );
}

export function openAddDataModelDialog() {
  return overlay.openAsync<string | undefined>(({ isOpen, close }) => (
    <Dialog open={isOpen} onOpenChange={(v) => !v && close(undefined)}>
      <DialogContent className="flex h-[88dvh] flex-col overflow-hidden sm:max-w-7xl">
        <DialogHeader className="shrink-0">
          <DialogTitle>Create Data Model</DialogTitle>
          <DialogDescription>
            Configure the data model metadata and build its attributes before
            saving.
          </DialogDescription>
        </DialogHeader>
        <AddDataModelDialogBody onClose={close} />
      </DialogContent>
    </Dialog>
  ));
}
