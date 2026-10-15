import { useId } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@e8ight/ui/components/ui/alert';
import { Button } from '@e8ight/ui/components/ui/button';
import { Checkbox } from '@e8ight/ui/components/ui/checkbox';
import { openConfirmDialog } from '@e8ight/ui/components/ui/confirm-dialog';
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
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@e8ight/ui/components/ui/field';
import { Input } from '@e8ight/ui/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@e8ight/ui/components/ui/select';
import { toast } from '@e8ight/ui/components/ui/sonner';
import { Spinner } from '@e8ight/ui/components/ui/spinner';
import { Textarea } from '@e8ight/ui/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { cn } from 'cn';
import { AlertTriangle, Database } from 'lucide-react';
import { overlay } from 'overlay-kit';

import { usePostEntityMutation } from '@/apis/entity';
import { modelQueries } from '@/apis/model';
import EntityAttributeTypeBadge from '@/app/(app)/service/entities/_components/EntityAttributeTypeBadge';
import { RelationshipTargetPicker } from '@/app/(app)/service/entities/_components/RelationshipTargetPicker';
import {
  entityCreateSchema,
  type EntityAttributeInputValues,
  type EntityCreateFormValues,
} from '@/app/(app)/service/entities/_schemas/entityCreate.schema';
import {
  buildEntityPayload,
  entityIdPrefix,
} from '@/app/(app)/service/entities/_utils/buildEntityPayload';

import type { DataModelGetResponse } from '@/apis/model';
import type { ApiError } from '@/types/error';

const JSON_VALUE_TYPES = [
  'Object',
  'ArrayString',
  'ArrayInteger',
  'ArrayDouble',
  'ArrayBoolean',
  'ArrayObject',
];

function valuePlaceholder(attribute: EntityAttributeInputValues) {
  if (attribute.type === 'GeoProperty') {
    return '{ "type": "Point", "coordinates": [126.978, 37.5665] }';
  }
  switch (attribute.valueType) {
    case 'Integer':
      return '예: 10';
    case 'Double':
      return '예: 12.5';
    case 'Date':
      return '예: 2026-09-18T09:00:00';
    case 'Object':
      return '{ "key": "value" }';
    case 'ArrayString':
      return '["a", "b"]';
    case 'ArrayInteger':
    case 'ArrayDouble':
      return '[1, 2, 3]';
    case 'ArrayBoolean':
      return '[true, false]';
    case 'ArrayObject':
      return '[{ "key": "value" }]';
    default:
      return '';
  }
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function toAttributeInputs(
  model: DataModelGetResponse,
): EntityAttributeInputValues[] {
  const required = model.required ?? [];
  return Object.entries(model.attributes).map(([name, attribute]) => ({
    name,
    type: attribute.type ?? 'Property',
    valueType: attribute.valueType ?? 'String',
    required: required.includes(name),
    enabled: required.includes(name),
    value: '',
    targets: [],
  }));
}

interface EntityCreateFormProps {
  contextId: string;
  model: DataModelGetResponse;
  onDone: () => void;
}

function EntityCreateForm({ contextId, model, onDone }: EntityCreateFormProps) {
  const id = useId();
  const postEntity = usePostEntityMutation();
  const {
    register,
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EntityCreateFormValues>({
    resolver: zodResolver(entityCreateSchema),
    defaultValues: { idSuffix: '', attributes: toAttributeInputs(model) },
    mode: 'onTouched',
  });
  const { fields } = useFieldArray({ control, name: 'attributes' });
  const watchedAttributes = watch('attributes');
  const idSuffix = watch('idSuffix');
  const prefix = entityIdPrefix(model.type);

  const onSubmit = async (values: EntityCreateFormValues) => {
    const payload = buildEntityPayload(values, model.type, contextId);
    const confirmed = await openConfirmDialog({
      title: '실제 데이터에 반영됩니다',
      message: `${payload.id} 엔티티를 브로커에 저장합니다. 같은 ID가 있으면 덮어쓰며, 이 화면에서는 되돌리거나 삭제할 수 없습니다. 계속하시겠습니까?`,
      confirmText: '실제 데이터로 저장',
    });
    if (!confirmed) return;
    try {
      await postEntity.mutateAsync(payload);
      toast.success(`${payload.id} 엔티티를 저장했습니다.`);
      onDone();
    } catch (error) {
      const detail = axios.isAxiosError(error)
        ? ((error.response?.data as ApiError | undefined)?.detail ??
          (error.response?.data as { message?: string } | undefined)?.message)
        : undefined;
      setError('root', {
        message: detail ?? '엔티티 저장에 실패했습니다.',
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit, () =>
        toast.error('입력 항목을 확인해주세요.'),
      )}
      className="flex min-h-0 flex-1 flex-col gap-3"
    >
      <Alert variant="destructive">
        <AlertTriangle />
        <AlertTitle>실제 데이터 반영</AlertTitle>
        <AlertDescription>
          저장 즉시 브로커에 엔티티가 생성되며 같은 ID는 덮어씁니다. 이
          화면에서는 삭제할 수 없으니 테스트 데이터는 ID에 표시를 남기세요.
          시계열(observedAt) 값은 수집 파이프라인으로만 들어갑니다.
        </AlertDescription>
      </Alert>
      {errors.root && <FieldError>{errors.root.message}</FieldError>}

      <fieldset
        disabled={postEntity.isPending}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1"
      >
        <Field data-invalid={!!errors.idSuffix}>
          <FieldLabel htmlFor={`${id}-suffix`}>Entity ID *</FieldLabel>
          <div className="flex items-center gap-2">
            <code className="text-muted-foreground shrink-0 font-mono text-xs">
              {prefix}
            </code>
            <Input
              id={`${id}-suffix`}
              className="font-mono"
              placeholder="KR-101117-0002"
              aria-invalid={!!errors.idSuffix}
              {...register('idSuffix')}
            />
          </div>
          <FieldDescription>
            저장될 ID: <code className="font-mono">{prefix}</code>
            <code className="font-mono">{idSuffix || '…'}</code> · 컨텍스트{' '}
            <code className="font-mono">{contextId}</code>
          </FieldDescription>
          <FieldError errors={[errors.idSuffix]} />
        </Field>

        <div className="space-y-3">
          <span className="text-primary text-sm font-bold tracking-[.03em]">
            속성 값 ({watchedAttributes.filter((a) => a.enabled).length} /{' '}
            {fields.length} 포함)
          </span>
          {fields.map((field, index) => {
            const attribute = watchedAttributes[index];
            const attributeErrors = errors.attributes?.[index];
            const modelAttribute = model.attributes[field.name];
            return (
              <div
                key={field.id}
                className={cn(
                  'border-border rounded-md border p-3',
                  !attribute.enabled && 'bg-muted/40',
                )}
              >
                <div className="flex items-center gap-2">
                  <Controller
                    control={control}
                    name={`attributes.${index}.enabled`}
                    render={({ field: enabledField }) => (
                      <Checkbox
                        id={`${id}-enabled-${index}`}
                        checked={enabledField.value}
                        disabled={attribute.required}
                        onCheckedChange={(checked) =>
                          enabledField.onChange(checked === true)
                        }
                      />
                    )}
                  />
                  <label
                    htmlFor={`${id}-enabled-${index}`}
                    className="text-foreground text-sm font-bold"
                  >
                    {field.name}
                    {attribute.required && (
                      <span className="text-destructive"> *</span>
                    )}
                  </label>
                  <EntityAttributeTypeBadge type={attribute.type} />
                  <span className="text-muted-foreground text-xs">
                    {attribute.valueType}
                  </span>
                </div>
                <FieldError errors={[attributeErrors?.enabled]} />
                {attribute.enabled && (
                  <div className="mt-2">
                    {attribute.type === 'Relationship' ? (
                      <Controller
                        control={control}
                        name={`attributes.${index}.targets`}
                        render={({ field: targetsField }) => (
                          <RelationshipTargetPicker
                            contextId={contextId}
                            modelTypes={stringList(modelAttribute?.modelType)}
                            value={targetsField.value}
                            onChange={targetsField.onChange}
                          />
                        )}
                      />
                    ) : attribute.valueType === 'Boolean' ? (
                      <Controller
                        control={control}
                        name={`attributes.${index}.value`}
                        render={({ field: valueField }) => (
                          <Select
                            value={valueField.value}
                            onValueChange={valueField.onChange}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="true / false" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">true</SelectItem>
                              <SelectItem value="false">false</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    ) : attribute.type === 'GeoProperty' ||
                      JSON_VALUE_TYPES.includes(attribute.valueType) ? (
                      <Textarea
                        rows={3}
                        className="font-mono text-xs"
                        placeholder={valuePlaceholder(attribute)}
                        aria-invalid={!!attributeErrors?.value}
                        {...register(`attributes.${index}.value`)}
                      />
                    ) : (
                      <Input
                        placeholder={valuePlaceholder(attribute)}
                        aria-invalid={!!attributeErrors?.value}
                        {...register(`attributes.${index}.value`)}
                      />
                    )}
                    {stringList(modelAttribute?.enum).length > 0 && (
                      <FieldDescription>
                        허용 값: {stringList(modelAttribute?.enum).join(', ')}
                      </FieldDescription>
                    )}
                    <FieldError
                      errors={[
                        attributeErrors?.value,
                        attributeErrors?.targets as
                          { message?: string } | undefined,
                      ]}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </fieldset>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            닫기
          </Button>
        </DialogClose>
        <Button
          type="submit"
          variant="destructive"
          disabled={isSubmitting || postEntity.isPending}
        >
          {postEntity.isPending && <Spinner className="size-4" />}
          <Database />
          실제 데이터로 저장
        </Button>
      </DialogFooter>
    </form>
  );
}

function EntityCreateLoader({
  contextId,
  modelId,
  onDone,
}: {
  contextId: string;
  modelId: string;
  onDone: () => void;
}) {
  const {
    data: model,
    isPending,
    isError,
  } = useQuery({
    ...modelQueries.detail(modelId),
    retry: false,
  });

  if (isPending) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Spinner className="text-muted-foreground size-6" />
      </div>
    );
  }
  if (isError || !model) {
    return (
      <p className="text-destructive text-sm">
        데이터 모델 &apos;{modelId}&apos;을 불러오지 못했습니다.
      </p>
    );
  }
  return (
    <EntityCreateForm contextId={contextId} model={model} onDone={onDone} />
  );
}

interface OpenEntityCreateDialogParams {
  contextId: string;
  modelId: string;
}

export function openEntityCreateDialog({
  contextId,
  modelId,
}: OpenEntityCreateDialogParams) {
  return overlay.openAsync<void>(({ isOpen, close }) => (
    <Dialog open={isOpen} onOpenChange={(v) => !v && close()}>
      <DialogContent className="flex max-h-[90svh] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>엔티티 직접 입력 — {modelId}</DialogTitle>
          <DialogDescription>
            데이터 모델의 속성별로 값을 입력해 NGSI-LD 엔티티를 브로커에 바로
            저장합니다. 관계(Relationship) 속성은 대상 엔티티를 골라 연결합니다.
          </DialogDescription>
        </DialogHeader>
        <EntityCreateLoader
          contextId={contextId}
          modelId={modelId}
          onDone={close}
        />
      </DialogContent>
    </Dialog>
  ));
}
