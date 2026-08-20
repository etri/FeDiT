'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';

import {
  Alert,
  AlertAction,
  AlertDescription,
} from '@e8ight/ui/components/ui/alert';
import { Badge } from '@e8ight/ui/components/ui/badge';
import { Button } from '@e8ight/ui/components/ui/button';
import { openConfirmDialog } from '@e8ight/ui/components/ui/confirm-dialog';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@e8ight/ui/components/ui/resizable';
import { toast } from '@e8ight/ui/components/ui/sonner';
import { Spinner } from '@e8ight/ui/components/ui/spinner';
import { useIsMobile } from '@e8ight/ui/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { AlertCircle, X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

import { dtmetaKeys } from '@/apis/dtmeta';
import {
  modelQueries,
  usePutModelReadyMutation,
  useDeleteModelMutation,
} from '@/apis/model';
import DataModelAttribute from '@/app/(app)/service/models/_components/dataModelDetail/DataModelAttribute';
import DataModelInfo from '@/app/(app)/service/models/_components/dataModelDetail/DataModelInfo';
import DataModelTitle from '@/app/(app)/service/models/_components/dataModelDetail/DataModelTitle';
import { openFederatedTwinObjectDialog } from '@/app/(app)/service/models/_components/dataModelDetail/FederatedTwinObjectDialog';
import DataModelTree from '@/app/(app)/service/models/_components/dataModelTree/DataModelTree';
import { useModel } from '@/app/(app)/service/models/_hooks/useModel';
import {
  dataModelSchema,
  type DataModelFormValues,
} from '@/app/(app)/service/models/_schemas/dataModel.schema';
import { useDataModelStore } from '@/app/(app)/service/models/_stores/useDataModelStore';
import { attributesToArray } from '@/app/(app)/service/models/_utils/dataModelUtils';
import { syncFederatedTwinSchema } from '@/app/(app)/service/models/_utils/syncFederatedTwinSchema';

import type { DataModelAttributeFormatted } from '@/types/dataModel';

const getErrorDetail = (err: unknown) =>
  (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;

function DataModelDetail() {
  const modelId = useParams<{ modelId?: string[] }>().modelId?.[0];

  if (!modelId) {
    return null;
  }

  return <DataModelDetailContent modelId={modelId} />;
}

function DataModelDetailContent({ modelId }: { modelId: string }) {
  const { data } = useSuspenseQuery(modelQueries.detail(modelId));

  const modelSelected = useDataModelStore((s) => s.modelSelected);
  const setModelSelected = useDataModelStore((s) => s.setModelSelected);
  const editMode = useDataModelStore((s) => s.editMode);
  const setEditMode = useDataModelStore((s) => s.setEditMode);
  const setModelAttribute = useDataModelStore((s) => s.setModelAttribute);
  const modelAttribute = useDataModelStore((s) => s.modelAttribute);
  const putModelReadyMutation = usePutModelReadyMutation();
  const deleteModelMutation = useDeleteModelMutation();
  const queryClient = useQueryClient();
  const router = useRouter();
  const isMobile = useIsMobile();

  const backupAttributesRef = useRef<DataModelAttributeFormatted[]>([]);
  const backupFormRef = useRef<DataModelFormValues | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isReadying, setIsReadying] = useState(false);

  useEffect(() => {
    setModelSelected([]);
    setEditMode(false);
  }, [modelId, setModelSelected, setEditMode]);

  useEffect(() => {
    setModelAttribute(attributesToArray(data.attributeNames, data.attributes));
  }, [data, setModelAttribute]);

  const { update } = useModel();

  const methods = useForm<DataModelFormValues>({
    resolver: zodResolver(dataModelSchema),
    defaultValues: {
      id: data.id,
      type: data.type,
      title: data.title,
      description: data.description,
      reference: data.reference || [],
    },
  });

  const handleEdit = () => {
    backupAttributesRef.current = structuredClone(modelAttribute);
    backupFormRef.current = structuredClone(methods.getValues());
    setEditMode(true);
  };

  const handleCancel = () => {
    setModelAttribute(backupAttributesRef.current);
    if (backupFormRef.current) {
      methods.reset(backupFormRef.current);
    }
    setEditMode(false);
    setErrorMessage('');
  };

  const onSubmit = async (values: DataModelFormValues) => {
    const result = await update(values);
    if (!result.ok) {
      setErrorMessage(result.message);
    }
    setEditMode(false);
  };

  const handleDelete = async () => {
    const confirmed = await openConfirmDialog({
      title: 'Delete Data Model',
      message: 'Are you sure you want to delete this data model?',
      confirmText: 'Delete',
    });
    if (!confirmed) {
      return;
    }
    try {
      const res = await deleteModelMutation.mutateAsync(modelId);
      toast.success(String(res));
      router.push('/service/models');
    } catch (err: unknown) {
      setErrorMessage(getErrorDetail(err) ?? 'Failed to delete');
    }
  };

  const handleChangeReady = async () => {
    const choice = await openFederatedTwinObjectDialog(data.title);
    if (!choice) {
      return;
    }
    setIsReadying(true);
    try {
      if (choice !== 'none') {
        const count = await syncFederatedTwinSchema(data, choice);
        queryClient.invalidateQueries({ queryKey: dtmetaKeys.all });
        toast.success(
          `Published ${count} properties to schemaInformation of ${choice.dtoid}.`,
        );
      }
      const res = await putModelReadyMutation.mutateAsync(data.type);
      toast.success(String(res));
    } catch (err: unknown) {
      setErrorMessage(
        getErrorDetail(err) ?? (err instanceof Error ? err.message : ''),
      );
    } finally {
      setIsReadying(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        className="flex h-full w-full flex-col"
        onSubmit={methods.handleSubmit(onSubmit, () =>
          toast.error('Please check the form fields.'),
        )}
      >
        <div className="flex shrink-0 items-center gap-2 px-4 pt-4 pb-2">
          <DataModelTitle id={data.type} uri={data.id} isReady={data.isReady} />
          {editMode && <Badge variant="secondary">Editing</Badge>}
        </div>
        <ResizablePanelGroup
          direction={isMobile ? 'vertical' : 'horizontal'}
          className="min-h-0 flex-1"
        >
          <ResizablePanel defaultSize={35} minSize={25}>
            <div className="h-full space-y-4 overflow-auto p-4">
              {errorMessage !== '' && (
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                  <AlertAction>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setErrorMessage('')}
                    >
                      <X className="size-4" />
                    </Button>
                  </AlertAction>
                </Alert>
              )}
              <DataModelInfo />
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={65}>
            <div className="flex h-full min-w-0 flex-col gap-4 overflow-hidden p-4 md:flex-row">
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
        {data.isReady === false && (
          <div className="flex shrink-0 justify-end gap-2 px-4 py-3">
            {editMode ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={deleteModelMutation.isPending}
                  onClick={handleDelete}
                >
                  {deleteModelMutation.isPending ? (
                    <Spinner className="size-4" />
                  ) : (
                    'Delete'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isReadying || putModelReadyMutation.isPending}
                  onClick={handleChangeReady}
                >
                  {isReadying || putModelReadyMutation.isPending ? (
                    <Spinner className="size-4" />
                  ) : (
                    'Change status to Ready'
                  )}
                </Button>
                <Button type="button" size="sm" onClick={handleEdit}>
                  Edit
                </Button>
              </>
            )}
          </div>
        )}
      </form>
    </FormProvider>
  );
}

export default DataModelDetail;
