'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { openConfirmDialog } from '@e8ight/ui/components/ui/confirm-dialog';
import { toast } from '@e8ight/ui/components/ui/sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';

import {
  contextQueries,
  useCreateContextWithModelsMutation,
  useDeleteContextMutation,
  useSyncContextModelsMutation,
} from '@/apis/context';
import { ContextDataModelPickerDialog } from '@/app/(app)/service/contexts/_components/ContextDataModelPickerDialog';
import { ContextStructureCard } from '@/app/(app)/service/contexts/_components/ContextStructureCard';
import { ContextUriField } from '@/app/(app)/service/contexts/_components/ContextUriField';
import {
  contextSchema,
  type ContextFormValues,
} from '@/app/(app)/service/contexts/_schemas/context.schema';
import { partitionContextModels } from '@/app/(app)/service/contexts/_utils/modelList';

import type { CreateContextPayload, ContextModel } from '@/types/context';
import type { ApiError } from '@/types/error';

const DEFAULT_ERROR_MESSAGE =
  'An error occurred. Please contact the development team.';

const DEFAULT_CONTEXT_ENTRIES = {
  e8ight: 'https://e8ight-data-models/',
  common: 'https://e8ight-data-models/common/',
  'ngsi-ld': 'https://uri.etsi.org/ngsi-ld/',
};

const getErrorDetail = (err: unknown) =>
  (err as { response?: { data?: ApiError } }).response?.data?.detail;

type ContextDetailPayload = Record<string, unknown> & {
  '@context'?: Record<string, string>;
};

interface ContextStructureInnerProps {
  detailData?: ContextDetailPayload;
  createMode?: boolean;
  routeContextId?: string;
  onCreated?: (contextId: string) => void;
  onCancelCreate?: () => void;
}

const NGSI_LD_MODEL_IRI_PREFIX = 'https://uri.etsi.org/ngsi-ld/';

const makeVersionedContextId = (contextId: string) => {
  const index = contextId.lastIndexOf('.jsonld');
  if (index === -1) {
    return contextId;
  }
  return `${contextId.slice(0, index)}-v1.0.1${contextId.slice(index)}`;
};

function ContextStructureInner({
  detailData,
  createMode: isCreate = false,
  routeContextId,
  onCreated,
  onCancelCreate,
}: ContextStructureInnerProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [contextModelList, setContextModelList] = useState<ContextModel[]>([]);
  const [dataModelPickerOpen, setDataModelPickerOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [prevContextModelList, setPrevContextModelList] = useState<
    ContextModel[]
  >([]);

  const createWithModelsMutation = useCreateContextWithModelsMutation();
  const syncModelsMutation = useSyncContextModelsMutation();
  const deleteContextMutation = useDeleteContextMutation();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ContextFormValues>({
    resolver: zodResolver(contextSchema),
    defaultValues: { contextId: '' },
  });

  const { ref: registerRef, ...contextIdField } = register('contextId');

  const watchedContextId = watch('contextId');
  const contextId = isCreate ? watchedContextId : (routeContextId ?? '');

  const onClickCreateContext = handleSubmit(
    (data) => {
      const versionedUrl = makeVersionedContextId(data.contextId);
      const reqBody: CreateContextPayload = {
        url: versionedUrl,
        version: 'v1.0.1',
        defaultUrl: data.contextId,
        '@context': DEFAULT_CONTEXT_ENTRIES,
      };
      const modelTitles = contextModelList
        .filter((item) => item.type === 'Model')
        .map((item) => item.title);

      createWithModelsMutation.mutate(
        {
          body: reqBody,
          versionedUrl,
          modelTitles,
        },
        {
          onSuccess: () => {
            setErrorText('');
            toast.success('Created successfully.');
            if (onCreated) {
              onCreated(versionedUrl);
              return;
            }
            router.replace(
              `/service/contexts/${encodeURIComponent(versionedUrl)}`,
            );
          },
          onError: (err: unknown) => {
            inputRef.current?.focus();
            setErrorText(getErrorDetail(err) ?? DEFAULT_ERROR_MESSAGE);
          },
        },
      );
    },
    () => toast.error('Please check the form fields.'),
  );

  const onClickEditContext = () => {
    const currentTitles = partitionContextModels(contextModelList).models.map(
      (m) => m.title,
    );
    const prevTitles = partitionContextModels(prevContextModelList).models.map(
      (m) => m.title,
    );
    const addItem = currentTitles.filter((t) => !prevTitles.includes(t));
    const subItem = prevTitles.filter((t) => !currentTitles.includes(t));

    syncModelsMutation.mutate(
      { contextUrl: contextId, addItem, subItem },
      {
        onSuccess: () => {
          setErrorText('');
          toast.success('Updated successfully.');
          setIsEdit(false);
          setDataModelPickerOpen(false);
          setPrevContextModelList(contextModelList);
          router.push(`/service/contexts/${encodeURIComponent(contextId)}`);
        },
        onError: (err: unknown) =>
          setErrorText(getErrorDetail(err) ?? DEFAULT_ERROR_MESSAGE),
      },
    );
  };

  const handleDelete = async () => {
    const arr = contextModelList.filter((item) => item.type === 'Model');
    if (arr.length !== 0) {
      setErrorText('Cannot delete while models are included');
      return;
    }
    const confirmed = await openConfirmDialog({
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this context?',
      confirmText: 'Delete',
    });
    if (!confirmed) {
      return;
    }

    deleteContextMutation.mutate(contextId, {
      onSuccess: () => {
        toast.success('Deleted successfully.');
        router.replace('/service/contexts');
      },
      onError: (err: unknown) =>
        setErrorText(getErrorDetail(err) ?? DEFAULT_ERROR_MESSAGE),
    });
  };

  const onClickDeleteDataModel = (data: string) => {
    setContextModelList(contextModelList.filter((item) => item.title !== data));
  };

  const handleCancel = () => {
    if (isCreate) {
      setDataModelPickerOpen(false);
      setErrorText('');
      onCancelCreate?.();
      return;
    }

    setIsEdit(false);
    setDataModelPickerOpen(false);
    setErrorText('');
    setContextModelList(prevContextModelList);
  };

  useEffect(() => {
    if (isCreate) {
      setIsEdit(false);
      setContextModelList(
        Object.keys(DEFAULT_CONTEXT_ENTRIES).map((title) => ({
          type: 'attr',
          title,
        })),
      );
      setErrorText('');
      setDataModelPickerOpen(false);
      reset({ contextId: '' });
      return;
    }

    setIsEdit(false);
    setErrorText('');
    reset({ contextId: routeContextId });
  }, [isCreate, routeContextId, reset]);

  useEffect(() => {
    if (isCreate || !routeContextId) {
      return;
    }
    if (!detailData) {
      return;
    }

    const contextEntries = detailData['@context'] ?? {};
    const models: ContextModel[] = [];
    const attrs: ContextModel[] = [];
    Object.entries(contextEntries).forEach(([item, iri]) => {
      const type =
        /^[A-Z]/.test(item) && iri.startsWith(NGSI_LD_MODEL_IRI_PREFIX)
          ? 'Model'
          : 'attr';
      (type === 'Model' ? models : attrs).push({ type, title: item });
    });
    const merged = [...models, ...attrs];
    setContextModelList(merged);
    setPrevContextModelList(merged);
  }, [detailData, isCreate, routeContextId]);

  const showDraftActions =
    !isCreate && Boolean(routeContextId) && detailData != null;
  const { attrs: baseEntries, models: modelEntries } =
    partitionContextModels(contextModelList);

  return (
    <>
      <div className="flex min-h-0 w-full flex-1 flex-col gap-4">
        <ContextUriField
          errorText={errorText}
          errorMessage={errors.contextId?.message}
          hasError={!!errors.contextId}
          isCreate={isCreate}
          field={contextIdField}
          inputRef={(el) => {
            registerRef(el);
            inputRef.current = el;
          }}
        />

        <ContextStructureCard
          isCreate={isCreate}
          isEdit={isEdit}
          showDraftActions={showDraftActions}
          modelEntries={modelEntries}
          baseEntries={baseEntries}
          onOpenPicker={() => setDataModelPickerOpen(true)}
          onRemoveModel={onClickDeleteDataModel}
          onCancel={handleCancel}
          onCreate={() => onClickCreateContext()}
          onEditSave={onClickEditContext}
          onStartEdit={() => {
            setIsEdit(true);
          }}
          onDelete={handleDelete}
        />
      </div>

      <ContextDataModelPickerDialog
        open={dataModelPickerOpen}
        onOpenChange={setDataModelPickerOpen}
        contextModelList={contextModelList}
        setContextModelList={setContextModelList}
      />
    </>
  );
}

function ContextStructureDetailSuspended({
  routeContextId,
}: {
  routeContextId: string;
}) {
  const { data: detailData } = useSuspenseQuery(
    contextQueries.detail(routeContextId),
  );
  return (
    <ContextStructureInner
      routeContextId={routeContextId}
      detailData={detailData}
    />
  );
}

interface ContextStructureProps {
  createMode?: boolean;
  onCreated?: (contextId: string) => void;
  onCancelCreate?: () => void;
}

export function ContextStructure({
  createMode = false,
  onCreated,
  onCancelCreate,
}: ContextStructureProps) {
  const { contextId: _ctxSlug } = useParams<{ contextId?: string[] }>();
  const routeContextId = _ctxSlug?.[0]
    ? decodeURIComponent(_ctxSlug[0])
    : undefined;

  if (createMode) {
    return (
      <ContextStructureInner
        createMode
        routeContextId={routeContextId}
        onCreated={onCreated}
        onCancelCreate={onCancelCreate}
      />
    );
  }

  if (!routeContextId) {
    return null;
  }

  return <ContextStructureDetailSuspended routeContextId={routeContextId} />;
}
