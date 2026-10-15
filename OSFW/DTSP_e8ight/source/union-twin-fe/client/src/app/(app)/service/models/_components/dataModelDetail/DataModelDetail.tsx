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

import { useReenrollContextModelMutation } from '@/apis/context';
import { dtmetaKeys } from '@/apis/dtmeta';
import {
  modelQueries,
  usePostModelVersionUpMutation,
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
import { useRuntimeConfig } from '@/components/providers/RuntimeConfigProvider';

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
  const versionUpMutation = usePostModelVersionUpMutation();
  const deleteModelMutation = useDeleteModelMutation();
  const reenrollContextModelMutation = useReenrollContextModelMutation();
  const queryClient = useQueryClient();
  const { brokerUrl } = useRuntimeConfig();
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
    const result = await update(values, data.required);
    if (!result.ok) {
      setErrorMessage(result.message);
    }
    setEditMode(false);
  };

  const handleDelete = async () => {
    const confirmed = await openConfirmDialog({
      title: 'Delete Data Model',
      message: data.isReady
        ? '준비 완료된 데이터 모델입니다. 이미 수집된 데이터가 있을 수 있습니다. 삭제하시겠습니까?'
        : '이전 버전이 있다면 그 버전으로 되돌아갑니다. 이 데이터 모델을 삭제하시겠습니까?',
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

  const handleVersionUp = async () => {
    const confirmed = await openConfirmDialog({
      title: 'Version up Data Model',
      message:
        '현재 버전을 스냅샷으로 보관하고 버전을 올립니다. 버전을 올리면 이 데이터 모델을 다시 수정할 수 있습니다. 계속하시겠습니까?',
      confirmText: 'Version up',
    });
    if (!confirmed) {
      return;
    }
    try {
      await versionUpMutation.mutateAsync({
        id: data.id,
        type: data.type,
        title: data.title,
        description: data.description,
        reference: data.reference,
        attributeNames: data.attributeNames,
        attributes: data.attributes,
        required: data.required,
        isDynamic: data.isDynamic,
        isReady: false,
      });
      toast.success('Version up complete. You can edit this data model now.');
    } catch (err: unknown) {
      setErrorMessage(
        getErrorDetail(err) ??
          (err instanceof Error ? err.message : 'Failed to version up'),
      );
    }
  };

  const handleChangeReady = async () => {
    const choice = await openFederatedTwinObjectDialog({
      modelType: data.type,
      modelTitle: data.title,
      brokerUrl,
    });
    if (!choice) {
      return;
    }
    setIsReadying(true);
    try {
      if (choice !== 'none') {
        const count = await syncFederatedTwinSchema(data, choice, brokerUrl);
        queryClient.invalidateQueries({ queryKey: dtmetaKeys.all });
        toast.success(
          `Published ${count} properties to schemaInformation of ${choice.dtoid}.`,
        );
      }
      const res = await putModelReadyMutation.mutateAsync(data.type);
      toast.success(String(res));

      try {
        const contextUrls = await reenrollContextModelMutation.mutateAsync(
          data.type,
        );
        if (contextUrls.length > 0) {
          toast.success(
            `Re-enrolled this model in ${contextUrls.length} context(s).`,
          );
        }
      } catch (err: unknown) {
        toast.error(
          getErrorDetail(err) ??
            'Model is ready, but re-enrolling it in its contexts failed.',
        );
      }
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
              {data.isReady ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={versionUpMutation.isPending}
                  onClick={handleVersionUp}
                >
                  {versionUpMutation.isPending ? (
                    <Spinner className="size-4" />
                  ) : (
                    'Version up to edit'
                  )}
                </Button>
              ) : (
                <>
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
            </>
          )}
        </div>
      </form>
    </FormProvider>
  );
}

export default DataModelDetail;
