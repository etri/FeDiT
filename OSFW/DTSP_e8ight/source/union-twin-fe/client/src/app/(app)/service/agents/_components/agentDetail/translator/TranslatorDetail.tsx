import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@e8ight/ui/components/ui/button';
import { openConfirmDialog } from '@e8ight/ui/components/ui/confirm-dialog';
import { Field, FieldLabel } from '@e8ight/ui/components/ui/field';
import { Input } from '@e8ight/ui/components/ui/input';
import { Separator } from '@e8ight/ui/components/ui/separator';
import { toast } from '@e8ight/ui/components/ui/sonner';
import { Spinner } from '@e8ight/ui/components/ui/spinner';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import {
  Code,
  FlaskConical,
  Pencil,
  ScrollText,
  Trash2,
  Wand2,
} from 'lucide-react';

import {
  translatorQueries,
  useDeleteTranslatorMutation,
  useUpdateTranslatorMutation,
} from '@/apis/translator';
import CodeEditorPopup from '@/app/(app)/service/agents/_components/agentDetail/translator/CodeEditorPopup';
import CodeViewerPopup from '@/app/(app)/service/agents/_components/agentDetail/translator/CodeViewerPopup';
import { openNoCodeMappingDialog } from '@/app/(app)/service/agents/_components/agentDetail/translator/NoCodeMappingDialog';
import { isTranslatorRunning } from '@/app/(app)/service/agents/_components/agentDetail/translator/translatorStatus';
import { openTranslatorTestDialog } from '@/app/(app)/service/agents/_components/agentDetail/translator/TranslatorTestDialog';
import { openLogDialog } from '@/app/(app)/service/agents/_components/LogDialog';
import {
  translatorUpdateSchema,
  type TranslatorUpdateFormValues,
} from '@/app/(app)/service/agents/_schemas/translator.schema';
import { convertFullDateTimeFromString } from '@/lib/date';

import type { AgentModel } from '@/apis/agent';
import type {
  TranslatorType,
  TranslatorUpdateRequest,
} from '@/apis/translator/translator.types';
import type { ApiError } from '@/types/error';

interface TranslatorDetailProps {
  translator: TranslatorType;
  modelInfoList: AgentModel[];
  isEdit: boolean;
  onChangeIsEdit: () => void;
}

function TranslatorDetail({
  translator,
  modelInfoList,
  isEdit,
  onChangeIsEdit,
}: TranslatorDetailProps) {
  const [codePopupToggle, setCodePopupToggle] = useState(false);
  const [successCompile, setSuccessCompile] = useState<null | boolean>(null);

  const sourceTopicId = useId();
  const targetTopicId = useId();

  const deleteTranslatorMutation = useDeleteTranslatorMutation();
  const updateTranslatorMutation = useUpdateTranslatorMutation();

  const currentValues = () => ({
    sourceTopic: translator.sourceTopic ?? '',
    targetTopic: translator.targetTopic ?? '',
    translateCode: translator.translateCode,
  });

  const { register, handleSubmit, reset, watch, setValue, getValues } =
    useForm<TranslatorUpdateFormValues>({
      resolver: zodResolver(translatorUpdateSchema),
      defaultValues: currentValues(),
      mode: 'onTouched',
    });

  const openNoCodeMapping = async () => {
    const code = await openNoCodeMappingDialog({
      className: translator.name,
      modelType: translator.modelType,
      translateCode: getValues('translateCode'),
    });
    if (code) {
      setValue('translateCode', code);
      setSuccessCompile(null);
      toast.success(
        '코드를 생성했습니다. Edit Code에서 Compile로 확인해주세요.',
      );
    }
  };

  const handleEdit = () => {
    if (isTranslatorRunning(translator.status)) {
      toast.error('Please stop the translator before editing.');
      return;
    }
    reset(currentValues());
    setSuccessCompile(null);
    onChangeIsEdit();
  };

  const handleDelete = async () => {
    if (isTranslatorRunning(translator.status)) {
      toast.error('Please stop the translator before deleting.');
      return;
    }
    const confirmed = await openConfirmDialog({
      title: 'Confirm Delete',
      message: `Delete "${translator.name}"?`,
      confirmText: 'Delete',
    });
    if (!confirmed) {
      return;
    }
    try {
      await deleteTranslatorMutation.mutateAsync(translator.id);
      toast.success('Translator deleted.');
    } catch (error) {
      console.error(error);
      if (axios.isAxiosError(error)) {
        const errorResponse = error.response?.data as ApiError | undefined;
        toast.error(errorResponse?.detail ?? 'Please try again.');
      }
    }
  };

  const submitUpdate = handleSubmit(
    async (values) => {
      const context = modelInfoList.find(
        (el) => el.modelType === translator.modelType,
      )?.context;

      if (context === undefined) {
        toast.error(
          `No context found for model type "${translator.modelType}".`,
        );
        return;
      }

      if (
        values.translateCode !== translator.translateCode &&
        successCompile !== true
      ) {
        setSuccessCompile(false);
        toast.warning('Please compile the translate code before saving.');
        return;
      }

      const payload: TranslatorUpdateRequest = {
        agentId: translator.agentId,
        name: translator.name,
        modelType: translator.modelType,
        context,
        translateCode: values.translateCode,
        isCustomTopic: true,
        sourceTopic: values.sourceTopic,
        targetTopic: values.targetTopic === '' ? undefined : values.targetTopic,
      };

      try {
        await updateTranslatorMutation.mutateAsync({
          translatorId: translator.id,
          payload,
        });
        setSuccessCompile(null);
        onChangeIsEdit();
        toast.success('Translator updated.');
      } catch (error) {
        console.error(error);
        if (axios.isAxiosError(error)) {
          const errorResponse = error.response?.data as ApiError | undefined;
          toast.error(errorResponse?.detail ?? 'Please try again.');
        } else {
          toast.error('An unexpected error occurred. Please contact support.');
        }
      }
    },
    () => toast.error('Please check the form fields.'),
  );

  return (
    <form onSubmit={submitUpdate} className="border-border border-t px-4 py-4">
      <fieldset
        disabled={updateTranslatorMutation.isPending}
        className="space-y-3"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel>Name</FieldLabel>
            <Input value={translator.name} readOnly />
          </Field>
          <Field>
            <FieldLabel>Model Type</FieldLabel>
            <Input value={translator.modelType} readOnly />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field>
            <FieldLabel>ID</FieldLabel>
            <Input value={String(translator.id)} readOnly />
          </Field>
          <Field>
            <FieldLabel>Agent ID</FieldLabel>
            <Input value={String(translator.agentId)} readOnly />
          </Field>
          <Field>
            <FieldLabel>PID</FieldLabel>
            <Input
              value={translator.pid === null ? '-' : String(translator.pid)}
              readOnly
            />
          </Field>
          <Field>
            <FieldLabel>Last Translation</FieldLabel>
            <Input
              value={
                translator.lastSignalDatetime
                  ? convertFullDateTimeFromString(translator.lastSignalDatetime)
                  : '-'
              }
              readOnly
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor={sourceTopicId}>Source Topic</FieldLabel>
            {isEdit ? (
              <Input id={sourceTopicId} readOnly {...register('sourceTopic')} />
            ) : (
              <Input value={translator.sourceTopic || '-'} readOnly />
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor={targetTopicId}>Target Topic</FieldLabel>
            {isEdit ? (
              <Input id={targetTopicId} readOnly {...register('targetTopic')} />
            ) : (
              <Input value={translator.targetTopic || '-'} readOnly />
            )}
          </Field>
        </div>

        <Field>
          <FieldLabel>Translate Code</FieldLabel>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setCodePopupToggle(true)}
            >
              <Code className="size-3.5" />
              {isEdit ? 'Edit Code' : 'View Code'}
            </Button>
            {isEdit && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => void openNoCodeMapping()}
              >
                <Wand2 className="size-3.5" />
                노코드 매핑
              </Button>
            )}
            {successCompile === true && (
              <strong className="text-primary text-sm">Compiled</strong>
            )}
            {successCompile === false && (
              <strong className="text-destructive text-sm">
                Failed compile. Check your code.
              </strong>
            )}
          </div>
        </Field>
      </fieldset>

      <Separator className="my-4" />

      <div className="flex items-center justify-end gap-2">
        {isEdit ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onChangeIsEdit}
              disabled={updateTranslatorMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              key="save"
              type="submit"
              size="sm"
              disabled={updateTranslatorMutation.isPending}
            >
              {updateTranslatorMutation.isPending ? (
                <Spinner className="size-4" />
              ) : (
                'Save'
              )}
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() =>
                void openLogDialog({
                  title: `${translator.name} Logs`,
                  modelTypes: [translator.modelType],
                  options: translatorQueries.logs(translator.id),
                  failLogModelType: translator.modelType,
                })
              }
            >
              <ScrollText className="size-3.5" />
              Logs
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() =>
                void openTranslatorTestDialog({
                  translatorId: translator.id,
                  translatorName: translator.name,
                })
              }
            >
              <FlaskConical className="size-3.5" />
              Test
            </Button>
            <Button
              key="edit"
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={handleEdit}
            >
              <Pencil className="size-3.5" />
              Edit
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="gap-1.5"
              onClick={handleDelete}
              disabled={deleteTranslatorMutation.isPending}
            >
              {deleteTranslatorMutation.isPending ? (
                <Spinner className="size-4" />
              ) : (
                <>
                  <Trash2 className="size-3.5" />
                  Delete
                </>
              )}
            </Button>
          </>
        )}
      </div>

      {isEdit ? (
        <CodeEditorPopup
          open={codePopupToggle}
          translateCode={watch('translateCode')}
          onChangeCode={(value) => {
            setValue('translateCode', value);
            setSuccessCompile(null);
          }}
          translateName={translator.name}
          modelType={translator.modelType}
          closeCodeEditor={() => setCodePopupToggle(false)}
          onSuccessCompile={() => setSuccessCompile(true)}
          onFailCompile={() => setSuccessCompile(false)}
        />
      ) : (
        <CodeViewerPopup
          open={codePopupToggle}
          translateCode={translator.translateCode}
          closeCodeViewer={() => setCodePopupToggle(false)}
        />
      )}
    </form>
  );
}

export default TranslatorDetail;
