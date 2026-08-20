import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldTitle,
} from '@e8ight/ui/components/ui/field';
import { useQuery } from '@tanstack/react-query';

import { dtmetaQueries } from '@/apis/dtmeta';
import InputRenderer from '@/app/(app)/tracking/_components/InputRenderer';
import {
  FIELD_CONFIGS,
  SELECT_OPTIONS,
} from '@/app/(app)/tracking/_constants/formFieldConfigs';

import type { TrckProcInfo } from '@/app/(app)/tracking/_types/trackingProcessForm';

interface DataTrackingFieldsProps {
  process: TrckProcInfo;
  fieldErrors: Record<string, boolean>;
  onFieldChange: (field: string, value: unknown) => void;
}

const OBJECT_VALUE_TYPE_OPTIONS = [
  { value: '', label: 'Select an Object Type', disabled: true },
  { value: 'INTEGER', label: 'INTEGER' },
  { value: 'STRING', label: 'STRING' },
  { value: 'FLOAT', label: 'FLOAT' },
  { value: 'BOOLEAN', label: 'BOOLEAN' },
  { value: 'DOUBLE', label: 'DOUBLE' },
  { value: 'LONG', label: 'LONG' },
];

function DataTrackingFields({
  process,
  fieldErrors,
  onFieldChange,
}: DataTrackingFieldsProps) {
  const { data: federatedTwins } = useQuery(dtmetaQueries.federatedTwins());
  const twins = federatedTwins?.responseData ?? [];

  const selectedTwin = twins.find(
    (twin) => twin.dtid === process.federatedTwinId,
  );
  const objects = selectedTwin?.federatedDigitalTwinObjects ?? [];
  const selectedObject = objects.find(
    (object) => object.dtoid === process.federatedDigitalObjectId,
  );
  const schemaProperties = Object.keys(
    selectedObject?.digitalTwinObjectData?.schemaInformation?.properties ?? {},
  );

  const fdtOptions = [
    { value: '', label: 'Select a Federated Twin', disabled: true },
    ...twins.map((twin) => ({
      value: twin.dtid,
      label: twin.name ? `${twin.name} (${twin.dtid})` : twin.dtid,
    })),
  ];

  const fdoOptions = [
    { value: '', label: 'Select a Federated Digital Object', disabled: true },
    ...objects.flatMap((object) =>
      object.dtoid
        ? [
            {
              value: object.dtoid,
              label: object.name
                ? `${object.name} (${object.dtoid})`
                : object.dtoid,
            },
          ]
        : [],
    ),
  ];

  const pathOptions =
    schemaProperties.length > 0
      ? [
          { value: '', label: 'Select a Digital Object Path', disabled: true },
          ...schemaProperties.map((name) => ({ value: name, label: name })),
        ]
      : undefined;

  const selectFields = [
    {
      field: 'federatedTwinId',
      value: process.federatedTwinId,
      config: FIELD_CONFIGS.federatedTwinId,
      options: fdtOptions,
      onChange: (val: unknown) => {
        onFieldChange('federatedTwinId', val);
        onFieldChange('federatedDigitalObjectId', '');
        onFieldChange('trckValInfo.digitalObjectPath', '');
      },
    },
    {
      field: 'federatedDigitalObjectId',
      value: process.federatedDigitalObjectId,
      config: FIELD_CONFIGS.federatedDigitalObjectId,
      options: fdoOptions,
      onChange: (val: unknown) => {
        onFieldChange('federatedDigitalObjectId', val);
        onFieldChange('trckValInfo.digitalObjectPath', '');
      },
    },
  ] as const;

  const textFields = [
    {
      field: 'digitalTwinId',
      value: process.digitalTwinId,
      config: FIELD_CONFIGS.digitalTwinId,
    },
    {
      field: 'digitalObjId',
      value: process.digitalObjId,
      config: FIELD_CONFIGS.digitalObjId,
    },
    {
      field: 'trckTopic',
      value: process.trckTopic,
      config: FIELD_CONFIGS.trckTopic,
    },
  ] as const;

  const secondaryFields = [
    {
      field: 'evntDelay',
      type: 'number' as const,
      value: process.evntDelay,
      config: FIELD_CONFIGS.evntDelay,
      options: undefined,
    },
    {
      field: 'bufferSize',
      type: 'number' as const,
      value: process.bufferSize,
      config: FIELD_CONFIGS.bufferSize,
      options: undefined,
    },
    {
      field: 'dtFltTp',
      type: 'select' as const,
      value: process.dtFltTp,
      config: FIELD_CONFIGS.dtFltTp,
      options: SELECT_OPTIONS.dataFilterType,
    },
  ] as const;

  return (
    <>
      {selectFields.map(({ field, value, config, options, onChange }) => (
        <Field key={field} orientation="responsive" className="gap-4">
          <FieldContent className="w-full md:w-[300px] md:flex-none md:shrink-0">
            <FieldTitle className="text-foreground text-sm font-medium">
              {config.label}
              {config.required ? (
                <span className="text-destructive">*</span>
              ) : null}
            </FieldTitle>
            <FieldDescription>{config.description}</FieldDescription>
          </FieldContent>
          <div className="w-full md:min-w-0 md:flex-1">
            <InputRenderer
              type="select"
              value={value}
              onChange={onChange}
              error={fieldErrors[field]}
              placeholder={config.placeholder}
              options={options}
            />
          </div>
        </Field>
      ))}

      {textFields.map(({ field, value, config }) => (
        <Field key={field} orientation="responsive" className="gap-4">
          <FieldContent className="w-full md:w-[300px] md:flex-none md:shrink-0">
            <FieldTitle className="text-foreground text-sm font-medium">
              {config.label}
              {config.required ? (
                <span className="text-destructive">*</span>
              ) : null}
            </FieldTitle>
            <FieldDescription>{config.description}</FieldDescription>
          </FieldContent>
          <div className="w-full md:min-w-0 md:flex-1">
            <InputRenderer
              type="text"
              value={value}
              onChange={(val) => onFieldChange(field, val)}
              error={fieldErrors[field]}
              placeholder={config.placeholder}
            />
          </div>
        </Field>
      ))}

      <Field orientation="responsive" className="gap-4">
        <FieldContent className="w-[300px] flex-none shrink-0">
          <FieldTitle className="text-foreground text-sm font-medium">
            Tracking Value Info
            <span className="text-destructive text-xs font-normal">
              *데이터 트래킹 만 필수
            </span>
          </FieldTitle>
          <FieldDescription>
            트래킹 대상으로 처리할 데이터 값 (Path) 입력
          </FieldDescription>
        </FieldContent>
        <div className="min-w-0 flex-1">
          <FieldGroup
            className={
              'border-border bg-background flex w-full flex-col gap-3 rounded-lg border px-4 py-6'
            }
          >
            <Field orientation="responsive" className="gap-4">
              <FieldContent className="w-full max-w-[280px] flex-none shrink-0">
                <FieldTitle className="text-foreground text-sm font-medium">
                  Digital Object Path
                </FieldTitle>
                <FieldDescription>
                  메타정보 중 단일트윈 하부 구조 정보를 설정
                </FieldDescription>
              </FieldContent>
              <div className="w-full min-w-0 flex-1">
                <InputRenderer
                  type={pathOptions ? 'select' : 'text'}
                  value={process.trckValInfo.digitalObjectPath}
                  onChange={(val) =>
                    onFieldChange('trckValInfo.digitalObjectPath', val)
                  }
                  error={fieldErrors['trckValInfo.digitalObjectPath'] ?? false}
                  placeholder={'weatherMeasurement..list..wind_vvv'}
                  options={pathOptions}
                />
              </div>
            </Field>
            <Field orientation="responsive" className="gap-4">
              <FieldContent className="w-full max-w-[280px] flex-none shrink-0">
                <FieldTitle className="text-foreground text-sm font-medium">
                  Object Value Type
                </FieldTitle>
                <FieldDescription>처리되는 데이터 타입 정의</FieldDescription>
              </FieldContent>
              <div className="w-full min-w-0 flex-1">
                <InputRenderer
                  type="select"
                  value={process.trckValInfo.objValType}
                  onChange={(val) =>
                    onFieldChange('trckValInfo.objValType', val)
                  }
                  error={fieldErrors['trckValInfo.objValType'] ?? false}
                  options={OBJECT_VALUE_TYPE_OPTIONS}
                />
              </div>
            </Field>
          </FieldGroup>
        </div>
      </Field>

      {secondaryFields.map(({ field, type, value, config, options }) => (
        <Field key={field} orientation="responsive" className="gap-4">
          <FieldContent className="w-full md:w-[300px] md:flex-none md:shrink-0">
            <FieldTitle className="text-foreground text-sm font-medium">
              {config.label}
              {config.required ? (
                <span className="text-destructive">*</span>
              ) : null}
            </FieldTitle>
            <FieldDescription>{config.description}</FieldDescription>
          </FieldContent>
          <div className="w-full md:min-w-0 md:flex-1">
            <InputRenderer
              type={type}
              value={value}
              onChange={(val) => onFieldChange(field, val)}
              error={fieldErrors[field]}
              placeholder={
                'placeholder' in config ? config.placeholder : undefined
              }
              options={options}
            />
          </div>
        </Field>
      ))}
    </>
  );
}

export default DataTrackingFields;
