import { useEffect, useMemo, useRef, useState } from 'react';

import { Badge } from '@e8ight/ui/components/ui/badge';
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@e8ight/ui/components/ui/empty';
import { Field, FieldLabel } from '@e8ight/ui/components/ui/field';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
} from '@e8ight/ui/components/ui/item';
import { ScrollArea } from '@e8ight/ui/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@e8ight/ui/components/ui/select';
import { toast } from '@e8ight/ui/components/ui/sonner';
import { Spinner } from '@e8ight/ui/components/ui/spinner';
import { ErrorBoundary, Suspense } from '@suspensive/react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';

import { contextQueries } from '@/apis/context';
import { useAgentStore } from '@/app/(app)/service/agents/_stores/useAgentStore';
import { QueryErrorFallback } from '@/components/common/QueryErrorFallback';

import type { AgentModel } from '@/apis/agent';

interface ModelManagerModalProps {
  open: boolean;
  onClose: (value: boolean) => void;
}

interface ModelManagerBodyProps {
  onClose: (value: boolean) => void;
}

interface ModelOptionsProps {
  selectedContext: string;
  previewModels: AgentModel[];
  onAdd: (modelType: string) => void;
}

function ModelOptionsPlaceholder() {
  return (
    <>
      <Field className="min-w-0">
        <FieldLabel>Data Model</FieldLabel>
        <Select disabled>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="No models available" />
          </SelectTrigger>
        </Select>
      </Field>
      <Button size="sm" disabled>
        Add
      </Button>
    </>
  );
}

function ModelOptions({
  selectedContext,
  previewModels,
  onAdd,
}: ModelOptionsProps) {
  const [selectedModel, setSelectedModel] = useState('');

  const { data: contextInfoRes } = useSuspenseQuery({
    ...contextQueries.info(selectedContext),
  });

  const dataModelList = useMemo(() => {
    const registeredModelTypes = previewModels
      .filter((model) => model.context === selectedContext)
      .map((model) => model.modelType);

    return Object.keys(contextInfoRes).filter(
      (dataModel) =>
        dataModel[0].match(/[A-Z]/) &&
        !registeredModelTypes.includes(dataModel),
    );
  }, [selectedContext, previewModels, contextInfoRes]);

  useEffect(() => {
    setSelectedModel(dataModelList[0] ?? '');
  }, [dataModelList]);

  const isAddDisabled = dataModelList.length === 0;

  const handleAdd = () => {
    if (!selectedModel) {
      toast.warning('No selectable models available.');
      return;
    }
    onAdd(selectedModel);
  };

  return (
    <>
      <Field className="min-w-0">
        <FieldLabel>Data Model</FieldLabel>
        <Select
          value={selectedModel}
          onValueChange={setSelectedModel}
          disabled={isAddDisabled}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="No models available" />
          </SelectTrigger>
          <SelectContent>
            {dataModelList.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Button size="sm" onClick={handleAdd} disabled={isAddDisabled}>
        Add
      </Button>
    </>
  );
}

function ModelManagerBody({ onClose }: ModelManagerBodyProps) {
  const agentModel = useAgentStore((state) => state.agentModel);
  const setAgentModel = useAgentStore((state) => state.setAgentModel);

  const [previewModels, setPreviewModels] = useState<AgentModel[]>(() => [
    ...agentModel,
  ]);

  const [selectedContext, setSelectedContext] = useState('');
  const voneInitRef = useRef(false);

  const { data: contextVersionInfoList } = useSuspenseQuery(
    contextQueries.vone(),
  );

  useEffect(() => {
    if (voneInitRef.current) {
      return;
    }
    const first = contextVersionInfoList[0];
    if (first === undefined) {
      return;
    }
    voneInitRef.current = true;
    setSelectedContext(first.url);
  }, [contextVersionInfoList]);

  const handleAddToPreview = (modelType: string) => {
    setPreviewModels((prev) => [
      ...prev,
      {
        modelType,
        context: selectedContext,
      },
    ]);
  };

  const handleRemoveFromPreview = (modelType: string, context: string) => {
    setPreviewModels((prev) =>
      prev.filter(
        (model) =>
          !(model.modelType === modelType && model.context === context),
      ),
    );
  };

  const handleApply = () => {
    setAgentModel(previewModels);
    onClose(false);
  };

  return (
    <>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto">
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
            <Field className="min-w-0">
              <FieldLabel>Context</FieldLabel>
              <Select
                value={selectedContext}
                onValueChange={setSelectedContext}
              >
                <SelectTrigger className="w-full">
                  <SelectValue className="truncate" />
                </SelectTrigger>
                <SelectContent>
                  {contextVersionInfoList.map((item) => (
                    <SelectItem key={item.url} value={item.url}>
                      {item.url}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {selectedContext ? (
              <Suspense fallback={<ModelOptionsPlaceholder />}>
                <ModelOptions
                  selectedContext={selectedContext}
                  previewModels={previewModels}
                  onAdd={handleAddToPreview}
                />
              </Suspense>
            ) : (
              <ModelOptionsPlaceholder />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              Selected Models
              {previewModels.length > 0 && (
                <span className="text-muted-foreground ml-1.5">
                  ({previewModels.length})
                </span>
              )}
            </h4>
          </div>

          <div className="border-border max-h-[280px] min-h-[120px] overflow-hidden rounded-lg border">
            {previewModels.length === 0 ? (
              <Empty className="h-full border-0 bg-transparent py-8">
                <EmptyHeader>
                  <EmptyTitle>No models selected</EmptyTitle>
                  <EmptyDescription>
                    Select a context and data model above to add.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ScrollArea className="[&>[data-slot=scroll-area-viewport]]:max-h-[280px] [&>[data-slot=scroll-area-viewport]>div]:!block [&>[data-slot=scroll-area-viewport]>div]:min-w-0">
                <ItemGroup className="divide-border gap-0 divide-y">
                  {previewModels.map((model) => (
                    <Item
                      key={`${model.context}-${model.modelType}`}
                      role="listitem"
                      className="gap-3 px-4"
                    >
                      <Badge variant="secondary" className="shrink-0">
                        {model.modelType}
                      </Badge>
                      <ItemContent className="min-w-0">
                        <ItemDescription className="truncate text-xs">
                          {model.context}
                        </ItemDescription>
                      </ItemContent>
                      <ItemActions>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground flex size-9 shrink-0 items-center justify-center rounded transition-colors"
                          onClick={() =>
                            handleRemoveFromPreview(
                              model.modelType,
                              model.context,
                            )
                          }
                        >
                          <X className="size-3.5" />
                        </button>
                      </ItemActions>
                    </Item>
                  ))}
                </ItemGroup>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" onClick={() => onClose(false)}>
            Cancel
          </Button>
        </DialogClose>
        <Button onClick={handleApply}>Apply</Button>
      </DialogFooter>
    </>
  );
}

function ModelManagerModal({ open, onClose }: ModelManagerModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose(false)}>
      <DialogContent className="flex max-h-[85svh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Models</DialogTitle>
          <DialogDescription>
            Link context and data-model pairs to this agent.
          </DialogDescription>
        </DialogHeader>

        <ErrorBoundary fallback={<QueryErrorFallback />}>
          <Suspense
            fallback={
              <div className="flex min-h-[200px] items-center justify-center">
                <Spinner className="text-muted-foreground size-6" />
              </div>
            }
          >
            <ModelManagerBody onClose={onClose} />
          </Suspense>
        </ErrorBoundary>
      </DialogContent>
    </Dialog>
  );
}

export default ModelManagerModal;
