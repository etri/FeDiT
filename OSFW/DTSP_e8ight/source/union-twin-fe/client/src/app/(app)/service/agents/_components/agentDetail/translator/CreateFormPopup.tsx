import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@e8ight/ui/components/ui/button';
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
  FieldSet,
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
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { BookOpen, Wand2 } from 'lucide-react';

import {
  translatorQueries,
  useCreateTranslatorMutation,
} from '@/apis/translator';
import CodeEditorPopup from '@/app/(app)/service/agents/_components/agentDetail/translator/CodeEditorPopup';
import { openNoCodeMappingDialog } from '@/app/(app)/service/agents/_components/agentDetail/translator/NoCodeMappingDialog';
import { openTranslatorGuideDialog } from '@/app/(app)/service/agents/_components/agentDetail/translator/TranslatorGuideDialog';
import {
  DEFAULT_TOPIC,
  DEFAULT_TRANSLATED_TOPIC,
} from '@/app/(app)/service/agents/_constants/kafkaAgent';
import {
  translatorCreateSchema,
  type TranslatorCreateFormValues,
} from '@/app/(app)/service/agents/_schemas/translator.schema';

import type { AgentModel } from '@/apis/agent';
import type { TranslatorCreateRequest } from '@/apis/translator/translator.types';
import type { ApiError } from '@/types/error';

interface CreateFormPopupProps {
  open: boolean;
  agentId: number;
  agentTopic: string;
  modelInfoList: AgentModel[];
  closeCreateFormPopup: () => void;
}

function CreateFormPopup({
  open,
  agentId,
  agentTopic,
  modelInfoList,
  closeCreateFormPopup,
}: CreateFormPopupProps) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<TranslatorCreateFormValues>({
    resolver: zodResolver(translatorCreateSchema),
    defaultValues: {
      name: '',
      modelType: modelInfoList[0]?.modelType ?? '',
      sourceTopic: agentTopic || DEFAULT_TOPIC,
      targetTopic: DEFAULT_TRANSLATED_TOPIC,
      translateCode: '',
    },
  });

  const [successCompile, setSuccessCompile] = useState<null | boolean>(null);

  const translateNameInputRef = useRef<HTMLInputElement | null>(null);
  const [codeEditorToggle, setCodeEditorToggle] = useState(false);
  const queryClient = useQueryClient();
  const createTranslatorMutation = useCreateTranslatorMutation();

  const { ref: nameRef, ...nameField } = register('name');

  const watchedName = watch('name');
  const watchedTranslateCode = watch('translateCode');

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    nameField.onChange(e);
    if (getValues('translateCode').length > 0) {
      setValue('translateCode', '');
      setSuccessCompile(null);
    }
  };

  const openCodeEditor = async () => {
    const name = getValues('name');
    if (name !== '') {
      setCodeEditorToggle(true);
      if (getValues('translateCode') === '') {
        const translatorCodeTemplate = await queryClient.fetchQuery(
          translatorQueries.sample(name),
        );
        setValue('translateCode', translatorCodeTemplate);
      }
    } else {
      translateNameInputRef.current?.focus();
      toast.warning('Please set the translator Name first.');
    }
  };

  const openNoCodeMapping = async () => {
    const name = getValues('name');
    if (name === '') {
      translateNameInputRef.current?.focus();
      toast.warning('Please set the translator Name first.');
      return;
    }
    const code = await openNoCodeMappingDialog({
      className: name,
      modelType: getValues('modelType'),
      translateCode: getValues('translateCode'),
    });
    if (code) {
      setValue('translateCode', code);
      setSuccessCompile(null);
      toast.success('코드를 생성했습니다. 에디터에서 Compile로 확인해주세요.');
    }
  };

  const submitNewTranslator = handleSubmit(
    async (data) => {
      const context = modelInfoList.find(
        (el) => el.modelType === data.modelType,
      )?.context;

      if (context === undefined) {
        return;
      }

      const payload: TranslatorCreateRequest = {
        agentId,
        name: data.name,
        modelType: data.modelType,
        context,
        translateCode: data.translateCode,
        isCustomTopic: true,
        sourceTopic: data.sourceTopic,
        targetTopic: data.targetTopic === '' ? undefined : data.targetTopic,
      };

      if (successCompile === true) {
        try {
          await createTranslatorMutation.mutateAsync(payload);
          setSuccessCompile(null);
          closeCreateFormPopup();
          toast.success('Translator created successfully.');
        } catch (error) {
          console.error(error);
          if (axios.isAxiosError(error)) {
            const errorResponse = error.response?.data as ApiError | undefined;
            toast.error(errorResponse?.detail ?? 'Please try again.');
          } else {
            toast.error(
              'An unexpected error occurred. Please contact support.',
            );
          }
        }
      } else {
        setSuccessCompile(false);
        toast.warning('Please compile the translate code before saving.');
      }
    },
    () => toast.error('Please check the form fields.'),
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && closeCreateFormPopup()}>
      <DialogContent className="flex max-h-[85svh] flex-col sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 pr-6">
            <DialogTitle>Add New Translator</DialogTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void openTranslatorGuideDialog()}
            >
              <BookOpen />
              작성 가이드
            </Button>
          </div>
          <DialogDescription>
            Set the translator metadata and compile the translate code before
            saving.
          </DialogDescription>
        </DialogHeader>
        <FieldSet className="min-h-0 flex-1 overflow-y-auto py-2">
          <Field data-invalid={!!errors.name}>
            <FieldLabel>Name</FieldLabel>
            <Input
              type="text"
              {...nameField}
              onChange={handleNameChange}
              ref={(el) => {
                nameRef(el);
                translateNameInputRef.current = el;
              }}
            />
            <FieldError errors={[errors.name]} />
          </Field>

          <Field>
            <FieldLabel>Model Type</FieldLabel>
            <Controller
              control={control}
              name="modelType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {modelInfoList.map((m) => (
                      <SelectItem key={m.modelType} value={m.modelType}>
                        {m.modelType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field>
            <FieldLabel>Topic of data to be translated</FieldLabel>
            <Input type="text" readOnly {...register('sourceTopic')} />
            <FieldDescription>
              Agent 목적지 Topic과 자동으로 연결됩니다.
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel>Topic to publish the translated data to</FieldLabel>
            <Input type="text" readOnly {...register('targetTopic')} />
            <FieldDescription>
              브로커가 구독하는 고정 토픽입니다.
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel>Translate Code</FieldLabel>
            <div className="flex items-center gap-2">
              <Button type="button" onClick={openCodeEditor}>
                Open Editor
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void openNoCodeMapping()}
              >
                <Wand2 />
                노코드 매핑
              </Button>
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
        </FieldSet>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              onClick={closeCreateFormPopup}
              disabled={createTranslatorMutation.isPending}
            >
              Close
            </Button>
          </DialogClose>
          <Button
            onClick={() => submitNewTranslator()}
            disabled={createTranslatorMutation.isPending}
          >
            {createTranslatorMutation.isPending ? (
              <Spinner className="size-4" />
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>

        <CodeEditorPopup
          open={codeEditorToggle}
          translateCode={watchedTranslateCode}
          onChangeCode={(value) => {
            setValue('translateCode', value);
            setSuccessCompile(null);
          }}
          translateName={watchedName}
          modelType={watch('modelType')}
          closeCodeEditor={() => setCodeEditorToggle(false)}
          onSuccessCompile={() => setSuccessCompile(true)}
          onFailCompile={() => setSuccessCompile(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export default CreateFormPopup;
