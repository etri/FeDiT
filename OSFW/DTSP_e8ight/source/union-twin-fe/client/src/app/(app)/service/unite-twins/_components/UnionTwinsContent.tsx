'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';

import { openConfirmDialog } from '@e8ight/ui/components/ui/confirm-dialog';
import { toast } from '@e8ight/ui/components/ui/sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSuspenseQuery } from '@tanstack/react-query';

import {
  dtmetaQueries,
  useCreateFederatedTwinObjectMutation,
} from '@/apis/dtmeta';
import { usePostModelMutation } from '@/apis/model';
import { SchemaListPanel } from '@/app/(app)/service/unite-twins/_components/SchemaListPanel';
import { UnionModelForm } from '@/app/(app)/service/unite-twins/_components/UnionModelForm';
import {
  unionTwinModelSchema,
  type UnionModelFormValues,
} from '@/app/(app)/service/unite-twins/_schemas/union-model.schema';
import {
  buildChildModelPayloads,
  buildFederatedTwinPayload,
  buildUnionParentModelPayload,
  extractPropertiesFromSchema,
  resolvePropertyNames,
} from '@/app/(app)/service/unite-twins/_utils';
import { useMetadataCartStore } from '@/stores/useMetadataCartStore';

import type {
  UnionSchema,
  UnionSchemaItem,
} from '@/app/(app)/service/unite-twins/_types/unionSchema';

function toErrorDetail(error: unknown) {
  return error instanceof Error ? error.message : '알 수 없는 오류';
}

function isDuplicateError(error: unknown) {
  return (error as { response?: { status?: number } }).response?.status === 409;
}

export function UnionTwinsContent() {
  const cartItems = useMetadataCartStore((state) => state.items);
  const [isHydrated, setIsHydrated] = useState(false);

  const { data: federatedTwinSearch } = useSuspenseQuery(
    dtmetaQueries.federatedTwins(),
  );
  const createFederatedTwinObject = useCreateFederatedTwinObjectMutation();
  const postModel = usePostModelMutation();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const items = useMemo<UnionSchemaItem[]>(() => {
    if (!isHydrated) return [];
    return cartItems.map((item) => {
      const schema = (item.schemaInformation ?? {}) as UnionSchema;
      return {
        id: item.dtoid,
        schema,
        title: schema.title,
        name: item.name,
        digitalTwinId: item.digitalTwinId,
      };
    });
  }, [cartItems, isHydrated]);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<UnionModelFormValues>({
    resolver: zodResolver(unionTwinModelSchema),
    defaultValues: {
      federatedTwinId: '',
      type: '',
      title: '',
      subjects: [],
      description: '',
      createdBy: '',
      properties: [],
    },
    mode: 'onTouched',
  });

  const {
    fields: propertyFields,
    remove: removeProperty,
    append,
  } = useFieldArray({ control, name: 'properties' });

  const appliedSchemaIds = useMemo(() => {
    const ids = new Set<string>();
    propertyFields.forEach((_, i) => {
      const src = watch(`properties.${i}.sourceSchema`);
      if (src) ids.add(src);
    });
    return ids;
  }, [propertyFields, watch]);

  const registeredObjects =
    federatedTwinSearch.responseData.find(
      (twin) => twin.dtid === watch('federatedTwinId'),
    )?.federatedDigitalTwinObjects ?? [];
  const registeredSourceIds = new Set(
    registeredObjects.flatMap(
      (object) => object.relatedDigitalTwinObjects ?? [],
    ),
  );

  const groupedProperties = useMemo(() => {
    const groups: Record<
      string,
      { index: number; field: (typeof propertyFields)[0] }[]
    > = {};
    propertyFields.forEach((field, index) => {
      const source = watch(`properties.${index}.sourceSchema`) || 'Unknown';
      (groups[source] ??= []).push({ index, field });
    });
    return groups;
  }, [propertyFields, watch]);

  function handleToggleSchema(item: UnionSchemaItem) {
    if (appliedSchemaIds.has(item.id)) {
      const indexesToRemove: number[] = [];
      propertyFields.forEach((_, i) => {
        if (watch(`properties.${i}.sourceSchema`) === item.id)
          indexesToRemove.push(i);
      });
      indexesToRemove.sort((a, b) => b - a).forEach((i) => removeProperty(i));
      if (
        propertyFields.length - indexesToRemove.length === 0 &&
        !dirtyFields.title
      ) {
        setValue('title', '');
      }
      return;
    }

    const extracted = extractPropertiesFromSchema(item.schema, item.id);
    if (extracted.length === 0) {
      toast.error(`'${item.name || item.title}'에 추출할 속성이 없습니다.`);
      return;
    }
    extracted.forEach((property) => append(property));
    if (!dirtyFields.title) {
      const newCount = appliedSchemaIds.size + 1;
      setValue(
        'title',
        newCount === 1
          ? (item.schema?.title ?? '')
          : `연합 모델 (${newCount}개 통합)`,
      );
    }
  }

  async function handleCreateFederatedTwin(values: UnionModelFormValues) {
    const resolved = resolvePropertyNames(values, items);
    const childModels = buildChildModelPayloads(values, items);
    const parentModel = buildUnionParentModelPayload(values, childModels);

    let federatedPayload: ReturnType<typeof buildFederatedTwinPayload>;
    try {
      federatedPayload = buildFederatedTwinPayload(resolved, items);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : '연합 트윈 모델 생성에 실패했습니다.',
      );
      return;
    }

    if (registeredObjects.length) {
      const ok = await openConfirmDialog({
        title: '이미 등록된 객체가 있습니다',
        message: `이 연합 디지털 트윈에는 이미 ${registeredObjects.length}개의 객체가 등록되어 있으며, 새 객체로 추가됩니다. 계속하시겠습니까?`,
        confirmText: '계속',
        cancelText: '취소',
      });
      if (!ok) return;
    }

    try {
      await Promise.all(
        childModels.map((child) =>
          postModel.mutateAsync(child).catch((error) => {
            if (!isDuplicateError(error)) throw error;
          }),
        ),
      );
      await postModel.mutateAsync(parentModel);
    } catch (error) {
      toast.error(
        isDuplicateError(error)
          ? `'${parentModel.type}' 이름의 데이터 모델이 이미 존재합니다. Type을 다른 이름으로 바꾼 뒤 다시 시도해주세요. (${toErrorDetail(error)})`
          : `데이터 모델 생성에 실패했습니다. 연합 객체(KETI)는 아직 등록되지 않았으니 잠시 후 다시 시도해주세요. (${toErrorDetail(error)})`,
      );
      return;
    }

    try {
      await createFederatedTwinObject.mutateAsync(federatedPayload);
    } catch (error) {
      toast.error(
        `데이터 모델은 생성되었으나 연합 객체(KETI) 등록에 실패했습니다. 같은 이름으로 다시 생성하면 모델 중복 오류가 발생하니, 데이터 모델 화면에서 '${parentModel.type}' 모델을 삭제한 뒤 다시 시도해주세요. (${toErrorDetail(error)})`,
      );
      return;
    }

    reset();
    toast.success(
      '연합 트윈 모델이 생성되었습니다. 컨텍스트 화면에서 모델을 등록해주세요.',
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row xl:gap-6">
      <SchemaListPanel
        items={items}
        appliedSchemaIds={appliedSchemaIds}
        registeredSourceIds={registeredSourceIds}
        onToggle={handleToggleSchema}
      />
      <UnionModelForm
        items={items}
        appliedSchemaCount={appliedSchemaIds.size}
        registeredObjects={registeredObjects}
        federatedTwins={federatedTwinSearch.responseData}
        propertyFields={propertyFields}
        groupedProperties={groupedProperties}
        register={register}
        watch={watch}
        setValue={setValue}
        handleSubmit={handleSubmit}
        onSubmit={handleCreateFederatedTwin}
        onRemoveProperty={removeProperty}
        errors={errors}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
