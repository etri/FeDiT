'use client';

import type {
  FieldErrors,
  FieldArrayWithId,
  UseFormHandleSubmit,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';

import { Badge } from '@e8ight/ui/components/ui/badge';
import { Button } from '@e8ight/ui/components/ui/button';
import { Card } from '@e8ight/ui/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@e8ight/ui/components/ui/collapsible';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@e8ight/ui/components/ui/empty';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldSet,
} from '@e8ight/ui/components/ui/field';
import { Input } from '@e8ight/ui/components/ui/input';
import { ScrollArea } from '@e8ight/ui/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@e8ight/ui/components/ui/select';
import { Separator } from '@e8ight/ui/components/ui/separator';
import { toast } from '@e8ight/ui/components/ui/sonner';
import { Spinner } from '@e8ight/ui/components/ui/spinner';
import { ChevronDown } from 'lucide-react';

import { PropertyGroupSection } from '@/app/(app)/service/unite-twins/_components/PropertyGroupSection';
import { SubjectsField } from '@/app/(app)/service/unite-twins/_components/SubjectsField';
import { duplicatePropertyNames } from '@/app/(app)/service/unite-twins/_utils';

import type { FederatedDigitalTwinObject, FederatedTwin } from '@/apis/dtmeta';
import type { UnionModelFormValues } from '@/app/(app)/service/unite-twins/_schemas/union-model.schema';
import type { UnionSchemaItem } from '@/app/(app)/service/unite-twins/_types/unionSchema';

const FEDERATED_TWIN_PLACEHOLDER = {
  empty: '메타데이터에서 연합 디지털 트윈을 등록해주세요',
  ready: '연합 디지털 트윈을 선택하세요',
} as const;

const FIELD_ORDER = [
  'federatedTwinId',
  'type',
  'title',
  'subjects',
  'description',
  'properties',
] as const;

function deepErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  if ('message' in error && typeof error.message === 'string') {
    return error.message;
  }
  for (const nested of Object.values(error)) {
    const message = deepErrorMessage(nested);
    if (message) return message;
  }
  return undefined;
}

function firstErrorMessage(errors: FieldErrors<UnionModelFormValues>) {
  for (const field of FIELD_ORDER) {
    const message = deepErrorMessage(errors[field]);
    if (message) return message;
  }
  return undefined;
}

interface UnionModelFormProps {
  items: UnionSchemaItem[];
  appliedSchemaCount: number;
  registeredObjects: FederatedDigitalTwinObject[];
  federatedTwins: FederatedTwin[];
  propertyFields: FieldArrayWithId<UnionModelFormValues, 'properties', 'id'>[];
  groupedProperties: Record<
    string,
    {
      index: number;
      field: FieldArrayWithId<UnionModelFormValues, 'properties', 'id'>;
    }[]
  >;
  register: UseFormRegister<UnionModelFormValues>;
  watch: UseFormWatch<UnionModelFormValues>;
  setValue: UseFormSetValue<UnionModelFormValues>;
  handleSubmit: UseFormHandleSubmit<UnionModelFormValues>;
  onSubmit: (values: UnionModelFormValues) => Promise<void>;
  onRemoveProperty: (index: number) => void;
  errors: FieldErrors<UnionModelFormValues>;
  isSubmitting: boolean;
}

export function UnionModelForm({
  items,
  appliedSchemaCount,
  registeredObjects,
  federatedTwins,
  propertyFields,
  groupedProperties,
  register,
  watch,
  setValue,
  handleSubmit,
  onSubmit,
  onRemoveProperty,
  errors,
  isSubmitting,
}: UnionModelFormProps) {
  const federatedTwinsStatus = federatedTwins.length === 0 ? 'empty' : 'ready';

  const canSelectFederatedTwin = federatedTwinsStatus === 'ready';

  const duplicateNames = duplicatePropertyNames(watch('properties'));

  return (
    <Card className="min-h-0 min-w-0 flex-1 gap-0 py-0">
      <div className="shrink-0 px-4 py-3">
        <span className="text-foreground text-sm font-bold tracking-[.03em]">
          모델 구성
        </span>
        <p className="text-muted-foreground text-xs">
          {appliedSchemaCount === 0
            ? '왼쪽에서 스키마를 추가하여 모델을 구성하세요'
            : `${appliedSchemaCount}개의 스키마가 통합되었습니다`}
        </p>
      </div>
      <Separator />

      <form
        onSubmit={handleSubmit(onSubmit, (formErrors) =>
          toast.error(
            federatedTwinsStatus !== 'ready'
              ? FEDERATED_TWIN_PLACEHOLDER[federatedTwinsStatus]
              : (firstErrorMessage(formErrors) ?? '필수값을 확인해주세요'),
          ),
        )}
        className="flex min-h-0 flex-1 flex-col"
      >
        <ScrollArea className="min-h-0 flex-1 [&>[data-slot=scroll-area-viewport]>div]:!block">
          <div className="p-4">
            <FieldSet>
              <Field data-invalid={!!errors.federatedTwinId}>
                <FieldLabel>연합 디지털 트윈 *</FieldLabel>
                <Select
                  value={watch('federatedTwinId')}
                  disabled={!canSelectFederatedTwin}
                  onValueChange={(value) =>
                    setValue('federatedTwinId', value, { shouldValidate: true })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        FEDERATED_TWIN_PLACEHOLDER[federatedTwinsStatus]
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {federatedTwins.map((federatedTwin) => (
                      <SelectItem
                        key={federatedTwin.dtid}
                        value={federatedTwin.dtid}
                      >
                        <span className="inline-flex items-center gap-2">
                          {federatedTwin.name} ({federatedTwin.dtid})
                          {!!federatedTwin.federatedDigitalTwinObjects
                            ?.length && (
                            <Badge variant="secondary" className="font-bold">
                              등록됨
                            </Badge>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.federatedTwinId && (
                  <FieldError>{errors.federatedTwinId.message}</FieldError>
                )}
              </Field>
              <Field data-invalid={!!errors.type}>
                <FieldLabel>Type *</FieldLabel>
                <Input placeholder="UnionTwinModel" {...register('type')} />
                {errors.type ? (
                  <FieldError>{errors.type.message}</FieldError>
                ) : (
                  <FieldDescription>
                    데이터 모델 식별자. 영문 대문자로 시작하며 생성 후 변경할 수
                    없습니다
                  </FieldDescription>
                )}
              </Field>
              <Field data-invalid={!!errors.title}>
                <FieldLabel>Title *</FieldLabel>
                <Input placeholder="연합 트윈 모델" {...register('title')} />
                {errors.title && (
                  <FieldError>{errors.title.message}</FieldError>
                )}
              </Field>
              <SubjectsField
                value={watch('subjects')}
                onChange={(subjects) =>
                  setValue('subjects', subjects, { shouldValidate: true })
                }
                error={errors.subjects?.message}
              />
              <Field data-invalid={!!errors.description}>
                <FieldLabel>Description *</FieldLabel>
                <Input
                  placeholder="모델에 대한 설명을 입력하세요"
                  {...register('description')}
                />
                {errors.description && (
                  <FieldError>{errors.description.message}</FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel>Created By</FieldLabel>
                <Input placeholder="작성자" {...register('createdBy')} />
              </Field>
            </FieldSet>
          </div>

          <Separator />

          <div className="flex flex-col gap-3 p-4">
            {registeredObjects.length > 0 && (
              <RegisteredObjectSummary objects={registeredObjects} />
            )}

            <div className="flex items-center justify-between">
              <span className="text-foreground text-sm font-bold tracking-[.03em]">
                속성 목록
              </span>
              {propertyFields.length > 0 && (
                <Badge variant="secondary">총 {propertyFields.length}개</Badge>
              )}
            </div>

            {duplicateNames.size > 0 && (
              <p className="text-muted-foreground text-xs">
                이름이 겹치는 속성은 등록 시 출처 이름이 앞에 붙습니다:{' '}
                {[...duplicateNames].join(', ')}
              </p>
            )}

            {propertyFields.length === 0 ? (
              <Empty className="border-border rounded-lg border border-dashed py-12">
                <EmptyHeader>
                  <EmptyTitle>속성이 비어있습니다</EmptyTitle>
                  <EmptyDescription>
                    왼쪽 목록에서 &apos;Add&apos; 버튼을 눌러 속성을 추가하세요
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="space-y-3">
                {Object.entries(groupedProperties).map(([sourceId, props]) => {
                  const sourceItem = items.find((i) => i.id === sourceId);
                  return (
                    <PropertyGroupSection
                      key={sourceId}
                      title={sourceItem?.name || sourceItem?.title || sourceId}
                      subtitle={sourceItem?.digitalTwinId || ''}
                      count={props.length}
                      items={props}
                      register={register}
                      watch={watch}
                      setValue={setValue}
                      onRemove={onRemoveProperty}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        <Separator />

        <div className="flex shrink-0 justify-end p-4">
          <Button
            type="submit"
            disabled={isSubmitting || propertyFields.length === 0}
          >
            {isSubmitting ? (
              <>
                <Spinner className="size-4" />
                생성 중...
              </>
            ) : (
              '연합 트윈 모델 생성'
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}

interface RegisteredObjectSummaryProps {
  objects: FederatedDigitalTwinObject[];
}

function RegisteredObjectSummary({ objects }: RegisteredObjectSummaryProps) {
  return (
    <Collapsible className="bg-muted/40 border-border shrink-0 rounded-lg border px-3 py-2">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2">
        <span className="text-foreground text-sm">
          이미 등록된 객체 {objects.length}개
        </span>
        <ChevronDown className="text-muted-foreground size-4 shrink-0 transition-transform [[data-state=open]>&]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2">
        {objects.map((object, index) => (
          <div key={`${object.name}-${index}`}>
            <p className="text-foreground text-sm font-bold">{object.name}</p>
            <p className="text-muted-foreground text-xs">
              {Object.keys(
                object.digitalTwinObjectData?.schemaInformation?.properties ??
                  {},
              ).join(', ') || '속성 없음'}
            </p>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
