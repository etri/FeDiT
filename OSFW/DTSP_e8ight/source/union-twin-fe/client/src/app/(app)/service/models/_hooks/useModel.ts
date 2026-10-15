import { toast } from '@e8ight/ui/components/ui/sonner';

import { usePostModelMutation, usePutModelMutation } from '@/apis/model';
import { useDataModelStore } from '@/app/(app)/service/models/_stores/useDataModelStore';
import { attributesToObject } from '@/app/(app)/service/models/_utils/dataModelUtils';

import type { DataModelRequestPayload } from '@/apis/model';
import type { DataModelFormValues } from '@/app/(app)/service/models/_schemas/dataModel.schema';
import type { DataModelAttributeFormatted } from '@/types/dataModel';

type ModelSubmitResult = { ok: true } | { ok: false; message: string };

function getModelErrorMessage(error: unknown) {
  const responseError = error as {
    response?: { data?: { title?: string; detail?: string } };
  };

  return `${responseError.response?.data?.title ?? 'Request failed'} : ${responseError.response?.data?.detail ?? 'Please try again.'}`;
}

function validateAttributes(
  attributes: DataModelAttributeFormatted[],
): ModelSubmitResult {
  if (attributes.length === 0) {
    return {
      ok: false,
      message: 'Attributes is a required value. You have to check [Attributes]',
    };
  }
  return { ok: true };
}

export const useModel = (options?: {
  onCreated?: (modelId: string) => void;
}) => {
  const attributes = useDataModelStore((s) => s.modelAttribute);
  const postModelMutation = usePostModelMutation();
  const putModelMutation = usePutModelMutation();

  const create = async (
    values: DataModelFormValues,
  ): Promise<ModelSubmitResult> => {
    const validation = validateAttributes(attributes);
    if (!validation.ok) {
      return validation;
    }

    const type = `${values.type.charAt(0).toUpperCase()}${values.type.slice(1)}`;

    const obj = {
      ...values,
      ...attributesToObject(attributes),
      id: `urn:ngsi-ld:${type}:`,
      type,
    } as DataModelRequestPayload;

    try {
      const res = await postModelMutation.mutateAsync(obj);
      toast.success(String(res));
      options?.onCreated?.(values.type);
      return { ok: true };
    } catch (error: unknown) {
      return { ok: false, message: getModelErrorMessage(error) };
    }
  };

  const update = async (
    values: DataModelFormValues,
    required?: string[],
  ): Promise<ModelSubmitResult> => {
    const validation = validateAttributes(attributes);
    if (!validation.ok) {
      return validation;
    }

    const obj = {
      ...values,
      ...attributesToObject(attributes),
      ...(required && { required }),
    } as DataModelRequestPayload;

    try {
      const res = await putModelMutation.mutateAsync(obj);
      toast.success(String(res));
      return { ok: true };
    } catch (error: unknown) {
      return { ok: false, message: getModelErrorMessage(error) };
    }
  };

  return {
    create,
    update,
    isCreating: postModelMutation.isPending,
  };
};
