import { useId } from 'react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';

import { Badge } from '@e8ight/ui/components/ui/badge';
import { Button } from '@e8ight/ui/components/ui/button';
import { Field, FieldError, FieldLabel } from '@e8ight/ui/components/ui/field';
import { Input } from '@e8ight/ui/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@e8ight/ui/components/ui/select';
import { toast } from '@e8ight/ui/components/ui/sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@e8ight/ui/components/ui/table';
import { useQueryClient } from '@tanstack/react-query';
import { DatabaseZap, Plus, Trash2 } from 'lucide-react';

import { modelQueries } from '@/apis/model';
import { modelAttributesToSpec } from '@/app/(app)/service/agents/_utils/modelAttributesToSpec';
import {
  modelUrnPrefix,
  SPEC_VALUE_TYPES,
} from '@/app/(app)/service/agents/_utils/translatorSpec';

import type { TranslatorNoCodeFormValues } from '@/app/(app)/service/agents/_schemas/translatorNoCode.schema';
import type { TranslatorEntitySpec } from '@/app/(app)/service/agents/_utils/translatorSpec';

const SOURCE_KIND_LABELS = {
  object: '단일 객체 (최상위가 엔티티 1건)',
  array: '배열 (경로 아래 항목마다 엔티티 생성)',
  nested: '중첩 객체 (경로 아래 객체 1건)',
} as const;

const OBSERVED_AT_LABELS = {
  none: '사용 안 함',
  now: '현재 시각 (UTC)',
  field: '원천 시간 필드 사용',
} as const;

function sampleFields(
  sampleJson: string,
  source: TranslatorEntitySpec['source'],
) {
  try {
    const parsed: unknown = JSON.parse(sampleJson);
    if (typeof parsed !== 'object' || parsed === null) return [];
    const record = parsed as Record<string, unknown>;
    let target: unknown = record;
    if (source.kind === 'array') {
      const list = record[source.path];
      target = Array.isArray(list) ? list[0] : undefined;
    } else if (source.kind === 'nested') {
      target = record[source.path];
    }
    return typeof target === 'object' && target !== null
      ? Object.keys(target)
      : [];
  } catch {
    return [];
  }
}

interface NoCodeEntitySectionProps {
  index: number;
  canRemove: boolean;
  onRemove: () => void;
}

export function NoCodeEntitySection({
  index,
  canRemove,
  onRemove,
}: NoCodeEntitySectionProps) {
  const id = useId();
  const queryClient = useQueryClient();
  const {
    register,
    control,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext<TranslatorNoCodeFormValues>();
  const base = `entities.${index}` as const;
  const entityErrors = errors.entities?.[index];
  const {
    fields,
    append,
    remove,
    replace: replaceAttributes,
  } = useFieldArray({ control, name: `${base}.attributes` });

  const type = watch(`${base}.type`);
  const sourceKind = watch(`${base}.source.kind`);
  const sourcePath = watch(`${base}.source.path`);
  const observedAtKind = watch(`${base}.observedAt.kind`);
  const sampleJson = watch('sampleJson');
  const fieldOptions = sampleFields(sampleJson, {
    kind: sourceKind,
    path: sourcePath,
  });
  const fieldListId = `${id}-fields`;

  async function loadModelAttributes() {
    const modelType = getValues(`${base}.type`).trim();
    if (modelType === '') {
      toast.warning('엔티티 Type을 먼저 입력하세요.');
      return;
    }
    try {
      const model = await queryClient.fetchQuery({
        ...modelQueries.detail(modelType),
        retry: false,
      });
      replaceAttributes(modelAttributesToSpec(model));
      setValue(`${base}.entityId.prefix`, modelUrnPrefix(model.type));
      toast.success(
        `'${model.type}' 모델 속성 ${Object.keys(model.attributes).length}개를 불러왔습니다.`,
      );
    } catch {
      toast.error(`데이터 모델 '${modelType}'을 찾지 못했습니다.`);
    }
  }

  return (
    <section className="border-border rounded-lg border">
      <header className="bg-muted/40 flex items-center justify-between gap-2 px-3 py-2">
        <span className="text-primary text-sm font-bold tracking-[.03em]">
          엔티티 {index + 1}
          {type && (
            <span className="text-muted-foreground ml-2 font-mono text-xs font-normal">
              {type}
            </span>
          )}
        </span>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={`엔티티 ${index + 1} 삭제`}
            onClick={onRemove}
          >
            <Trash2 />
          </Button>
        )}
      </header>

      <div className="grid gap-4 p-3 md:grid-cols-[1fr_2fr]">
        <div className="flex flex-col gap-3">
          <Field data-invalid={!!entityErrors?.type}>
            <FieldLabel htmlFor={`${id}-type`}>
              엔티티 Type (데이터 모델)
            </FieldLabel>
            <div className="flex gap-1.5">
              <Input id={`${id}-type`} {...register(`${base}.type`)} />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="모델 속성 불러오기"
                title="모델 속성 불러오기"
                onClick={() => void loadModelAttributes()}
              >
                <DatabaseZap />
              </Button>
            </div>
            <FieldError errors={[entityErrors?.type]} />
          </Field>

          <Field data-invalid={!!entityErrors?.source?.path}>
            <FieldLabel htmlFor={`${id}-root-kind`}>원천 구조</FieldLabel>
            <Controller
              control={control}
              name={`${base}.source.kind`}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id={`${id}-root-kind`} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SOURCE_KIND_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {sourceKind !== 'object' && (
              <Input
                aria-label="원천 경로"
                placeholder={
                  sourceKind === 'array' ? 'samples' : 'vehicleSignal'
                }
                {...register(`${base}.source.path`)}
                aria-invalid={!!entityErrors?.source?.path}
              />
            )}
            <FieldError errors={[entityErrors?.source?.path]} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field data-invalid={!!entityErrors?.entityId?.prefix}>
              <FieldLabel htmlFor={`${id}-id-prefix`}>
                Entity ID prefix
              </FieldLabel>
              <Input
                id={`${id}-id-prefix`}
                {...register(`${base}.entityId.prefix`)}
              />
              <FieldError errors={[entityErrors?.entityId?.prefix]} />
            </Field>
            <Field data-invalid={!!entityErrors?.entityId?.field}>
              <FieldLabel htmlFor={`${id}-id-field`}>
                Entity ID 원천 필드
              </FieldLabel>
              <Input
                id={`${id}-id-field`}
                list={fieldListId}
                placeholder="id"
                {...register(`${base}.entityId.field`)}
              />
              <FieldError errors={[entityErrors?.entityId?.field]} />
            </Field>
          </div>
          <Field data-invalid={!!entityErrors?.entityId?.servicePath}>
            <FieldLabel htmlFor={`${id}-service-path`}>servicePath</FieldLabel>
            <Input
              id={`${id}-service-path`}
              {...register(`${base}.entityId.servicePath`)}
            />
            <FieldError errors={[entityErrors?.entityId?.servicePath]} />
          </Field>

          <Field>
            <FieldLabel htmlFor={`${id}-observed-kind`}>observedAt</FieldLabel>
            <Controller
              control={control}
              name={`${base}.observedAt.kind`}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id={`${id}-observed-kind`} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(OBSERVED_AT_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          {observedAtKind === 'field' && (
            <div className="grid grid-cols-[1fr_1fr_5rem] gap-3">
              <Field data-invalid={!!entityErrors?.observedAt?.field}>
                <FieldLabel htmlFor={`${id}-observed-field`}>
                  시간 필드
                </FieldLabel>
                <Input
                  id={`${id}-observed-field`}
                  list={fieldListId}
                  placeholder="timePoint"
                  {...register(`${base}.observedAt.field`)}
                />
                <FieldError errors={[entityErrors?.observedAt?.field]} />
              </Field>
              <Field data-invalid={!!entityErrors?.observedAt?.pattern}>
                <FieldLabel htmlFor={`${id}-observed-pattern`}>
                  패턴 (Java)
                </FieldLabel>
                <Input
                  id={`${id}-observed-pattern`}
                  {...register(`${base}.observedAt.pattern`)}
                />
                <FieldError errors={[entityErrors?.observedAt?.pattern]} />
              </Field>
              <Field>
                <FieldLabel htmlFor={`${id}-observed-offset`}>
                  오프셋
                </FieldLabel>
                <Input
                  id={`${id}-observed-offset`}
                  {...register(`${base}.observedAt.offset`)}
                />
              </Field>
            </div>
          )}
        </div>

        <div className="flex min-h-0 flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">
              {fieldOptions.length > 0
                ? `원천 필드 ${fieldOptions.length}개 인식: ${fieldOptions.join(', ')}`
                : '원천 샘플을 붙여넣으면 필드를 자동 완성 목록으로 제공합니다.'}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  name: '',
                  term: '',
                  kind: 'Property',
                  valueType: 'String',
                  field: '',
                  targetPrefix: '',
                })
              }
            >
              <Plus />
              속성 추가
            </Button>
          </div>
          <datalist id={fieldListId}>
            {fieldOptions.map((field) => (
              <option key={field} value={field} />
            ))}
          </datalist>
          <FieldError
            errors={[
              entityErrors?.attributes?.root ?? entityErrors?.attributes,
            ]}
          />
          <div className="border-border overflow-auto rounded-md border">
            <Table className="table-fixed">
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-muted-foreground h-9 w-[26%] px-2 text-xs">
                    모델 속성
                  </TableHead>
                  <TableHead className="text-muted-foreground h-9 w-[22%] px-2 text-xs">
                    타입
                  </TableHead>
                  <TableHead className="text-muted-foreground h-9 px-2 text-xs">
                    원천 필드
                  </TableHead>
                  <TableHead className="h-9 w-10 px-1" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.length === 0 && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={4}
                      className="text-muted-foreground px-3 py-4 text-center text-xs"
                    >
                      매핑된 속성이 없습니다. 모델 속성을 불러오거나 직접
                      추가하세요.
                    </TableCell>
                  </TableRow>
                )}
                {fields.map((row, attributeIndex) => {
                  const attributeBase =
                    `${base}.attributes.${attributeIndex}` as const;
                  const kind = watch(`${attributeBase}.kind`);
                  const rowErrors = entityErrors?.attributes?.[attributeIndex];
                  return (
                    <TableRow key={row.id} className="align-top">
                      <TableCell className="px-2 py-2">
                        <div className="flex flex-col gap-1">
                          <Input
                            aria-label="속성 이름"
                            placeholder="attribute"
                            className="h-8"
                            {...register(`${attributeBase}.name`)}
                            aria-invalid={!!rowErrors?.name}
                          />
                          <Input
                            aria-label="컨텍스트 이름"
                            placeholder="e8ight:attribute"
                            className="text-muted-foreground h-8 text-xs"
                            {...register(`${attributeBase}.term`)}
                            aria-invalid={!!rowErrors?.term}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="px-2 py-2">
                        <div className="flex flex-col gap-1">
                          <Controller
                            control={control}
                            name={`${attributeBase}.kind`}
                            render={({ field }) => (
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger
                                  size="sm"
                                  aria-label="속성 종류"
                                  className="w-full"
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Property">
                                    Property
                                  </SelectItem>
                                  <SelectItem value="Relationship">
                                    Relationship
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                          {kind === 'Property' ? (
                            <Controller
                              control={control}
                              name={`${attributeBase}.valueType`}
                              render={({ field }) => (
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger
                                    size="sm"
                                    aria-label="값 타입"
                                    className="w-full"
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {SPEC_VALUE_TYPES.map((valueType) => (
                                      <SelectItem
                                        key={valueType}
                                        value={valueType}
                                      >
                                        {valueType}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          ) : (
                            <Badge
                              variant="outline"
                              className="w-full justify-center"
                            >
                              URN
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-2 py-2">
                        <div className="flex flex-col gap-1">
                          <Input
                            aria-label="원천 필드"
                            list={fieldListId}
                            placeholder="source field"
                            className="h-8"
                            {...register(`${attributeBase}.field`)}
                            aria-invalid={!!rowErrors?.field}
                          />
                          {kind === 'Relationship' && (
                            <Input
                              aria-label="대상 URN prefix"
                              placeholder="urn:ngsi-ld:Building:"
                              className="h-8 text-xs"
                              {...register(`${attributeBase}.targetPrefix`)}
                              aria-invalid={!!rowErrors?.targetPrefix}
                            />
                          )}
                          <FieldError
                            errors={[
                              rowErrors?.name,
                              rowErrors?.term,
                              rowErrors?.field,
                              rowErrors?.targetPrefix,
                            ]}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="px-1 py-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`${row.name || '속성'} 삭제`}
                          onClick={() => remove(attributeIndex)}
                        >
                          <Trash2 />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </section>
  );
}
