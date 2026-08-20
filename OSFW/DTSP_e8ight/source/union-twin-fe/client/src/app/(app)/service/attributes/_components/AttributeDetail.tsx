'use client';

import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import {
  Alert,
  AlertAction,
  AlertDescription,
} from '@e8ight/ui/components/ui/alert';
import { Badge } from '@e8ight/ui/components/ui/badge';
import { Button } from '@e8ight/ui/components/ui/button';
import { openConfirmDialog } from '@e8ight/ui/components/ui/confirm-dialog';
import {
  Dialog,
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
  EmptyMedia,
  EmptyTitle,
} from '@e8ight/ui/components/ui/empty';
import { Field, FieldError, FieldLabel } from '@e8ight/ui/components/ui/field';
import { Input as UIInput } from '@e8ight/ui/components/ui/input';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@e8ight/ui/components/ui/resizable';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@e8ight/ui/components/ui/select';
import { toast } from '@e8ight/ui/components/ui/sonner';
import { Spinner } from '@e8ight/ui/components/ui/spinner';
import { useIsMobile } from '@e8ight/ui/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { ErrorBoundary, Suspense } from '@suspensive/react';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import axios from 'axios';
import { AlertCircle, Box } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { overlay } from 'overlay-kit';

import {
  attributeQueries,
  useDeleteAttrMutation,
  usePostAttrMutation,
  usePutAttrMutation,
  type AttributePayload,
} from '@/apis/attribute';
import { UsingDataModelList } from '@/app/(app)/service/attributes/_components/UsingDataModelList';
import {
  attributeSchema,
  type AttributeFormValues,
} from '@/app/(app)/service/attributes/_schemas/attribute.schema';
import { QueryErrorFallback } from '@/components/common/QueryErrorFallback';
import { ATTRIBUTE_VALUE_TYPES } from '@/constants/dataModelValueTypes';

import type { ApiError } from '@/types/error';

const NEW_ATTR_DEFAULTS: AttributeFormValues = {
  id: '',
  type: 'e8ight',
  valueType: ATTRIBUTE_VALUE_TYPES[0],
  title: '',
  description: '',
  format: '',
};

function buildAttributePayload(data: AttributeFormValues): AttributePayload {
  const payload: AttributePayload = {
    id: data.id,
    valueType: data.valueType,
    type: data.type,
  };
  if (data.title) {
    payload.title = data.title;
  }
  if (data.format) {
    payload.format = data.format;
  }
  if (data.description) {
    payload.description = data.description;
  }
  return payload;
}

export function AttributeEmptyState() {
  return (
    <Empty className="size-full">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Box />
        </EmptyMedia>
        <EmptyTitle>No attribute selected</EmptyTitle>
        <EmptyDescription>
          Select an attribute from the side panel, or add a new one.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export function AttributeDetailView() {
  const { attrId: _rawAttrId } = useParams<{ attrId: string }>();
  const attrId = _rawAttrId ? decodeURIComponent(_rawAttrId) : undefined;
  if (!attrId) return <AttributeEmptyState />;
  return <ExistingAttributeDetail attrId={attrId} />;
}

function ExistingAttributeDetail({ attrId }: { attrId: string }) {
  const { data } = useSuspenseQuery(attributeQueries.detail(attrId));

  const defaults: AttributeFormValues = {
    id: data.id ?? '',
    type: data.type ?? '',
    valueType: data.valueType ?? ATTRIBUTE_VALUE_TYPES[0],
    title: data.title ?? '',
    description: data.description ?? '',
    format: data.format ?? '',
  };

  return (
    <AttributeForm
      attrId={attrId}
      type={data.type}
      defaults={defaults}
      isNew={false}
    />
  );
}

interface AttributeFormProps {
  attrId: string;
  type: string;
  defaults: AttributeFormValues;
  isNew: boolean;
  onCreated?: (createdId: string) => void;
  onCancelNew?: () => void;
}

function AttributeForm({
  attrId,
  type,
  defaults,
  isNew,
  onCreated,
  onCancelNew,
}: AttributeFormProps) {
  const nav = useRouter();
  const isMobile = useIsMobile();
  const formRef = useRef<HTMLDivElement>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isEditMode, setIsEditMode] = useState(isNew);
  const postAttrMutation = usePostAttrMutation();
  const putAttrMutation = usePutAttrMutation();
  const deleteAttrMutation = useDeleteAttrMutation();

  const {
    register,
    control,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<AttributeFormValues>({
    resolver: zodResolver(attributeSchema),
    defaultValues: defaults,
  });

  const { data: usingModels = [] } = useQuery({
    ...attributeQueries.usingModels(attrId),
    enabled: !isNew && Boolean(attrId),
  });

  const isInUse = usingModels.length > 0;
  const isCustom = type === 'e8ight';
  const isFieldLocked = !isEditMode || !isCustom;
  const isPending =
    postAttrMutation.isPending ||
    putAttrMutation.isPending ||
    deleteAttrMutation.isPending;

  const formatErrorMessage = (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const errorResponse = error.response?.data as ApiError | undefined;
      const title = errorResponse?.title ?? 'Request failed';
      const detail = errorResponse?.detail ?? 'Please try again.';
      return `${title} : ${detail}`;
    }

    return 'Request failed : Please try again.';
  };

  const doSubmit = handleSubmit(
    async (data) => {
      const payload = buildAttributePayload(data);

      try {
        await postAttrMutation.mutateAsync(payload);
        setErrorMessage('');
        toast.success(`Attribute '${data.id}' has been registered.`);
        reset(NEW_ATTR_DEFAULTS);
        onCreated?.(data.id);
      } catch (error) {
        setErrorMessage(formatErrorMessage(error));
        formRef.current?.scrollTo(0, 0);
      }
    },
    () => toast.error('Please check the form fields.'),
  );

  const handleUpdate = handleSubmit(
    async (data) => {
      const payload = buildAttributePayload(data);

      try {
        await putAttrMutation.mutateAsync(payload);
        setErrorMessage('');
        toast.success(`Attribute '${data.id}' has been updated.`);
        setIsEditMode(false);
      } catch (error) {
        setErrorMessage(formatErrorMessage(error));
        formRef.current?.scrollTo(0, 0);
      }
    },
    () => toast.error('Please check the form fields.'),
  );

  const handleDelete = async () => {
    const currentId = getValues('id');
    const confirmed = await openConfirmDialog({
      title: 'Confirm Delete',
      message: `Are you sure you want to delete "${currentId}"?`,
      confirmText: 'Delete',
    });
    if (!confirmed) {
      return;
    }

    try {
      await deleteAttrMutation.mutateAsync(currentId);
      toast.success('Attribute deleted');
      nav.push('/service/attributes');
    } catch (error) {
      toast.error(
        axios.isAxiosError(error)
          ? ((error.response?.data as ApiError | undefined)?.detail ??
              'Delete failed')
          : 'Delete failed',
      );
    }
  };

  const handleCancel = () => {
    reset(defaults);
    if (isNew && onCancelNew) {
      setErrorMessage('');
      onCancelNew();
      return;
    }
    setIsEditMode(false);
    setErrorMessage('');
  };

  const formFields = (
    <>
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
              ✕
            </Button>
          </AlertAction>
        </Alert>
      )}
      {isNew && (
        <Field data-invalid={!!errors.id}>
          <FieldLabel>ID *</FieldLabel>
          <UIInput type="text" {...register('id')} />
          <FieldError errors={[errors.id]} />
        </Field>
      )}
      <Field>
        <FieldLabel>Type *</FieldLabel>
        <UIInput type="text" value={type} readOnly />
      </Field>
      <Field>
        <FieldLabel>ValueType *</FieldLabel>
        <Controller
          control={control}
          name="valueType"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={isFieldLocked}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {ATTRIBUTE_VALUE_TYPES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>
      <Field>
        <FieldLabel>Title</FieldLabel>
        <UIInput type="text" {...register('title')} readOnly={isFieldLocked} />
      </Field>
      <Field>
        <FieldLabel>Description</FieldLabel>
        <UIInput
          type="text"
          {...register('description')}
          readOnly={isFieldLocked}
        />
      </Field>
      <Field>
        <FieldLabel>Format</FieldLabel>
        <UIInput type="text" {...register('format')} readOnly={isFieldLocked} />
      </Field>
    </>
  );

  if (isNew) {
    return (
      <>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
          {formFields}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button size="sm" disabled={isPending} onClick={() => doSubmit()}>
            {isPending ? <Spinner className="size-4" /> : 'Create'}
          </Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex shrink-0 items-center gap-2 px-4 pt-4">
        <h2 className="text-foreground min-w-0 truncate text-lg font-bold">
          {attrId}
        </h2>
        {type && <Badge variant="secondary">{type}</Badge>}
        {isEditMode && <Badge>Editing</Badge>}
      </div>
      <ResizablePanelGroup
        direction={isMobile ? 'vertical' : 'horizontal'}
        className="min-h-0 flex-1"
      >
        <ResizablePanel defaultSize={50} minSize={30}>
          <div ref={formRef} className="h-full space-y-4 overflow-auto p-4">
            {formFields}
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={50} minSize={25}>
          <div className="h-full overflow-auto p-4">
            <FieldLabel>Using Data Model</FieldLabel>
            <ErrorBoundary fallback={<QueryErrorFallback />}>
              <Suspense clientOnly fallback={<Spinner className="size-6" />}>
                <UsingDataModelList attrId={attrId} />
              </Suspense>
            </ErrorBoundary>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
      {isCustom && (
        <div className="flex shrink-0 justify-end gap-2 px-4 py-3">
          {!isEditMode && !isInUse && (
            <>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                Delete
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => setIsEditMode(true)}
              >
                Edit
              </Button>
            </>
          )}
          {isEditMode && (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={isPending}
                onClick={() => handleUpdate()}
              >
                Save
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function openAddAttributeDialog() {
  return overlay.openAsync<string | undefined>(({ isOpen, close }) => (
    <Dialog open={isOpen} onOpenChange={(v) => !v && close(undefined)}>
      <DialogContent className="flex max-h-[85svh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Attribute</DialogTitle>
          <DialogDescription>
            Create a new attribute and save it when you are done.
          </DialogDescription>
        </DialogHeader>
        <AttributeForm
          attrId=""
          type="e8ight"
          defaults={NEW_ATTR_DEFAULTS}
          isNew
          onCreated={(createdId) => close(createdId)}
          onCancelNew={() => close(undefined)}
        />
      </DialogContent>
    </Dialog>
  ));
}
