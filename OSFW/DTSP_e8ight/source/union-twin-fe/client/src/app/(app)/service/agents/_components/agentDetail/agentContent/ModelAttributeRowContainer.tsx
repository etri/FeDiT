import { type FormEvent, useEffect, useState } from 'react';

import { Button } from '@e8ight/ui/components/ui/button';
import { openConfirmDialog } from '@e8ight/ui/components/ui/confirm-dialog';
import { Input } from '@e8ight/ui/components/ui/input';
import { Label } from '@e8ight/ui/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@e8ight/ui/components/ui/select';
import { toast } from '@e8ight/ui/components/ui/sonner';
import { Spinner } from '@e8ight/ui/components/ui/spinner';
import { TableCell, TableRow } from '@e8ight/ui/components/ui/table';
import { ErrorBoundary, Suspense } from '@suspensive/react';
import { useSuspenseQuery } from '@tanstack/react-query';

import {
  agentQueries,
  useDeleteAgentModelAttributeSourceMutation,
  usePostAgentModelAttributeSourceMutation,
} from '@/apis/agent';
import { modelQueries } from '@/apis/model';
import { useAgentStore } from '@/app/(app)/service/agents/_stores/useAgentStore';
import { QueryErrorFallback } from '@/components/common/QueryErrorFallback';

import type { AgentModelAttributeSource } from '@/apis/agent';

interface ModelAttributeRowsProps {
  modelType: string;
}

interface ModelAttributeRowContainerProps {
  modelType: string;
}

function ModelAttributeRows({ modelType }: ModelAttributeRowsProps) {
  const agentData = useAgentStore((state) => state.agent);

  const [addSourceMode, setAddSourceMode] = useState<boolean>(false);

  const [targetAttribute, setTargetAttribute] = useState<string>('');

  const [targetSource, setTargetSource] = useState<string>('');

  const [attributesByModelType, setAttributesByModelType] = useState<string[]>(
    [],
  );

  const { data: modelDetail } = useSuspenseQuery({
    ...modelQueries.detail(modelType),
  });

  const { data: modelAttributeSources } = useSuspenseQuery({
    ...agentQueries.attributeSources(agentData.id, { modelType }),
  });
  const postAgentModelAttributeSourceMutation =
    usePostAgentModelAttributeSourceMutation();
  const deleteAgentModelAttributeSourceMutation =
    useDeleteAgentModelAttributeSourceMutation();

  useEffect(() => {
    const attributes = Object.keys(modelDetail.attributeNames);

    if (attributes.length === 0) {
      toast.error(`There's no attribute in this data model: ${modelType}`);
      return;
    }

    setTargetAttribute(attributes[0]);
    setAttributesByModelType(attributes);
  }, [modelDetail]);

  const validation = () => {
    if (
      modelAttributeSources
        .map((source) => source.attributeName)
        .includes(targetAttribute)
    ) {
      toast.error(`Already registered attribute source: ${targetAttribute}`);
      return false;
    }

    if (targetSource === '') {
      toast.error('Source name is empty');
      return false;
    }

    return true;
  };

  const handleAddAttributeSource = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (validation() === false) {
      return;
    }

    try {
      await postAgentModelAttributeSourceMutation.mutateAsync({
        agentId: agentData.id,
        payload: {
          modelType,
          attributeName: targetAttribute,
          sourceName: targetSource,
        },
      });
      toast.success('Attribute source added successfully.');
      setTargetSource('');
    } catch {
      toast.error('Failed to add attribute source.');
    }
  };

  const handleDeleteAttributeSource = async (targetSourceId: number) => {
    const confirmed = await openConfirmDialog({
      title: 'Delete attribute source',
      message: 'Are you sure to delete this attribute source?',
      confirmText: 'Delete',
    });
    if (!confirmed) {
      return;
    }
    try {
      await deleteAgentModelAttributeSourceMutation.mutateAsync({
        agentId: agentData.id,
        attributeSourceId: targetSourceId,
      });
      toast.success('Attribute source deleted.');
    } catch {
      toast.error('Failed to delete attribute source.');
    }
  };

  return (
    <>
      {modelAttributeSources.map(
        (attributeSource: AgentModelAttributeSource) => {
          return (
            <TableRow key={attributeSource.id}>
              <TableCell className="wrap-anywhere whitespace-normal">
                ㄴ {attributeSource.attributeName}
              </TableCell>
              <TableCell className="whitespace-normal">
                <div className="flex items-center justify-between gap-2.5">
                  <div className="min-w-0">
                    <span>source:</span>
                    <strong className="wrap-anywhere">
                      {attributeSource.sourceName}
                    </strong>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    type="button"
                    onClick={() =>
                      handleDeleteAttributeSource(attributeSource.id)
                    }
                  >
                    delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        },
      )}
      <TableRow>
        <TableCell>
          {addSourceMode === false ? (
            <Button
              size="sm"
              type="button"
              onClick={() => setAddSourceMode(true)}
            >
              Add Source
            </Button>
          ) : (
            <Select value={targetAttribute} onValueChange={setTargetAttribute}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {attributesByModelType.map((attr) => (
                  <SelectItem key={attr} value={attr}>
                    {attr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </TableCell>
        <TableCell>
          {addSourceMode && (
            <form
              className="flex items-center justify-between gap-2.5"
              onSubmit={handleAddAttributeSource}
            >
              <Label htmlFor="source">source: </Label>
              <Input
                id="source"
                type="text"
                className="flex-1"
                value={targetSource}
                onChange={(event) => setTargetSource(event.target.value)}
                placeholder="input source name..."
              />

              <Button type="submit" size="sm">
                add
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddSourceMode(false)}
              >
                cancel
              </Button>
            </form>
          )}
        </TableCell>
      </TableRow>
    </>
  );
}

function ModelAttributeRowContainer({
  modelType,
}: ModelAttributeRowContainerProps) {
  return (
    <ErrorBoundary
      fallback={
        <TableRow>
          <TableCell colSpan={2}>
            <QueryErrorFallback />
          </TableCell>
        </TableRow>
      }
    >
      <Suspense
        fallback={
          <TableRow>
            <TableCell colSpan={2}>
              <div className="flex items-center justify-center py-4">
                <Spinner className="text-muted-foreground size-6" />
              </div>
            </TableCell>
          </TableRow>
        }
      >
        <ModelAttributeRows modelType={modelType} />
      </Suspense>
    </ErrorBoundary>
  );
}

export default ModelAttributeRowContainer;
