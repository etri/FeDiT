import { useId } from 'react';
import { FormProvider, useFieldArray, useForm } from 'react-hook-form';

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@e8ight/ui/components/ui/alert';
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
import { Field, FieldError, FieldLabel } from '@e8ight/ui/components/ui/field';
import { toast } from '@e8ight/ui/components/ui/sonner';
import { Spinner } from '@e8ight/ui/components/ui/spinner';
import { Textarea } from '@e8ight/ui/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Eye, Plus, Wand2 } from 'lucide-react';
import { overlay } from 'overlay-kit';

import { modelQueries } from '@/apis/model';
import { NoCodeEntitySection } from '@/app/(app)/service/agents/_components/agentDetail/translator/NoCodeEntitySection';
import { openTranslationPreviewDialog } from '@/app/(app)/service/agents/_components/agentDetail/translator/TranslationPreviewDialog';
import {
  translatorNoCodeSchema,
  type TranslatorNoCodeFormValues,
} from '@/app/(app)/service/agents/_schemas/translatorNoCode.schema';
import { generateTranslatorCode } from '@/app/(app)/service/agents/_utils/generateTranslatorCode';
import { modelAttributesToSpec } from '@/app/(app)/service/agents/_utils/modelAttributesToSpec';
import {
  emptyEntitySpec,
  parseTranslatorCode,
} from '@/app/(app)/service/agents/_utils/translatorSpec';

import type { DataModelGetResponse } from '@/apis/model';
import type {
  SpecAttribute,
  TranslatorSpec,
} from '@/app/(app)/service/agents/_utils/translatorSpec';

function mergeAttributes(
  fromModel: SpecAttribute[],
  fromCode: SpecAttribute[],
) {
  const byName = new Map(
    fromModel.map((attribute) => [attribute.name, attribute]),
  );
  fromCode.forEach((attribute) => {
    byName.set(attribute.name, { ...byName.get(attribute.name), ...attribute });
  });
  return [...byName.values()];
}

function initialEntities(
  modelType: string,
  model: DataModelGetResponse | undefined,
  parsed: ReturnType<typeof parseTranslatorCode>,
) {
  if (parsed.exact) return parsed.spec.entities;
  const modelAttributes = model ? modelAttributesToSpec(model) : [];
  return parsed.spec.entities.map((entity) =>
    entity.type === modelType
      ? {
          ...entity,
          attributes: mergeAttributes(modelAttributes, entity.attributes),
        }
      : entity,
  );
}

function toSpec(values: TranslatorNoCodeFormValues): TranslatorSpec {
  return { entities: values.entities };
}

interface NoCodeMappingBodyProps {
  className: string;
  modelType: string;
  model: DataModelGetResponse | undefined;
  translateCode: string;
  onGenerate: (code: string) => void;
}

function NoCodeMappingBody({
  className,
  modelType,
  model,
  translateCode,
  onGenerate,
}: NoCodeMappingBodyProps) {
  const id = useId();
  const parsed =
    translateCode.trim() === ''
      ? {
          spec: { entities: [emptyEntitySpec(modelType)] },
          exact: false,
          warnings: [],
        }
      : parseTranslatorCode(translateCode, modelType);
  const hasCodeMapping =
    parsed.exact ||
    parsed.spec.entities.some((entity) => entity.attributes.length > 0);

  const methods = useForm<TranslatorNoCodeFormValues>({
    resolver: zodResolver(translatorNoCodeSchema),
    defaultValues: {
      sampleJson: '',
      entities: initialEntities(modelType, model, parsed),
    },
    mode: 'onTouched',
  });
  const {
    register,
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = methods;
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'entities',
  });

  const onSubmit = (values: TranslatorNoCodeFormValues) => {
    onGenerate(generateTranslatorCode(toSpec(values), className));
  };

  function handlePreview() {
    const values = getValues();
    const result = translatorNoCodeSchema.safeParse(values);
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? '매핑을 확인해주세요.');
      return;
    }
    void openTranslationPreviewDialog({
      spec: toSpec(result.data),
      sample: values.sampleJson,
    });
  }

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit, () =>
          toast.error('매핑 항목을 확인해주세요.'),
        )}
        className="flex min-h-0 flex-1 flex-col gap-3"
      >
        {parsed.warnings.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>기존 코드에서 옮기지 못한 항목</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-4">
                {parsed.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
              코드 생성 시 현재 코드는 폼 내용으로 대체됩니다.
            </AlertDescription>
          </Alert>
        )}
        {!model && !hasCodeMapping && (
          <p className="text-muted-foreground text-xs">
            데이터 모델 &apos;{modelType}&apos;을 찾지 못해 모델 속성을 불러오지
            못했습니다. 속성을 직접 추가해 매핑하세요.
          </p>
        )}
        {hasCodeMapping && !parsed.exact && parsed.warnings.length === 0 && (
          <p className="text-muted-foreground text-xs">
            기존 코드에서 매핑을 읽어왔습니다. 코드 생성 시 현재 코드는 폼
            내용으로 대체됩니다.
          </p>
        )}

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
          <Field>
            <FieldLabel htmlFor={`${id}-sample`}>
              원천 데이터 샘플 (JSON 1건)
            </FieldLabel>
            <Textarea
              id={`${id}-sample`}
              rows={6}
              className="font-mono text-xs"
              placeholder='{ "id": 1, "title": "delectus aut autem" }'
              {...register('sampleJson')}
            />
          </Field>

          <div className="flex items-center justify-between">
            <span className="text-primary text-sm font-bold tracking-[.03em]">
              생성할 엔티티 {fields.length}개
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append(emptyEntitySpec(''))}
            >
              <Plus />
              엔티티 추가
            </Button>
          </div>
          <FieldError errors={[errors.entities?.root ?? errors.entities]} />
          {fields.map((entity, index) => (
            <NoCodeEntitySection
              key={entity.id}
              index={index}
              canRemove={fields.length > 1}
              onRemove={() => remove(index)}
            />
          ))}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handlePreview}>
            <Eye />
            예상 출력 미리보기
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              닫기
            </Button>
          </DialogClose>
          <Button type="submit">
            <Wand2 />
            코드 생성
          </Button>
        </DialogFooter>
      </form>
    </FormProvider>
  );
}

function NoCodeMappingLoader({
  modelType,
  ...props
}: Omit<NoCodeMappingBodyProps, 'model'>) {
  const { data: model, isPending } = useQuery({
    ...modelQueries.detail(modelType),
    retry: false,
  });

  if (isPending) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Spinner className="text-muted-foreground size-6" />
      </div>
    );
  }
  return <NoCodeMappingBody modelType={modelType} model={model} {...props} />;
}

interface OpenNoCodeMappingDialogParams {
  className: string;
  modelType: string;
  translateCode: string;
}

export function openNoCodeMappingDialog({
  className,
  modelType,
  translateCode,
}: OpenNoCodeMappingDialogParams) {
  return overlay.openAsync<string | undefined>(({ isOpen, close }) => (
    <Dialog open={isOpen} onOpenChange={(v) => !v && close(undefined)}>
      <DialogContent className="flex max-h-[90svh] flex-col sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>노코드 매핑</DialogTitle>
          <DialogDescription>
            원천 데이터 한 건에서 만들 엔티티를 정의하면 Translator 코드를
            생성합니다. 엔티티는 여러 개를 둘 수 있고, 생성된 코드는 에디터에서
            그대로 수정할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        <NoCodeMappingLoader
          className={className}
          modelType={modelType}
          translateCode={translateCode}
          onGenerate={close}
        />
      </DialogContent>
    </Dialog>
  ));
}
