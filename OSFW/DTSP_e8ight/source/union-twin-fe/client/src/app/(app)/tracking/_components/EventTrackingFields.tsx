import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldTitle,
} from '@e8ight/ui/components/ui/field';

import InputRenderer from '@/app/(app)/tracking/_components/InputRenderer';
import {
  FIELD_CONFIGS,
  SELECT_OPTIONS,
} from '@/app/(app)/tracking/_constants/formFieldConfigs';

import type { TrckProcInfo } from '@/app/(app)/tracking/_types/trackingProcessForm';

interface EventTrackingFieldsProps {
  process: TrckProcInfo;
  fieldErrors: Record<string, boolean>;
  onFieldChange: (field: string, value: unknown) => void;
}

const EVENT_TYPE_OPTIONS = [
  { value: '', label: 'Select an Event Type', disabled: true },
  { value: 'CP', label: 'CP' },
];

function EventTrackingFields({
  process,
  fieldErrors,
  onFieldChange,
}: EventTrackingFieldsProps) {
  return (
    <>
      <Field orientation="responsive" className="gap-4">
        <FieldContent
          className={'w-full md:w-[300px] md:flex-none md:shrink-0'}
        >
          <FieldTitle className="text-foreground text-sm font-medium">
            Event Condition
          </FieldTitle>
          <FieldDescription>이벤트 발생 조건</FieldDescription>
        </FieldContent>
        <div className={'w-full md:min-w-0 md:flex-1'}>
          <FieldGroup
            className={
              'border-border bg-background flex w-full flex-col gap-3 rounded-lg border px-4 py-6'
            }
          >
            <Field orientation="responsive" className="gap-4">
              <FieldContent className="w-full max-w-[280px] flex-none shrink-0">
                <FieldTitle className="text-foreground text-sm font-medium">
                  Event Condition Checkable
                </FieldTitle>
                <FieldDescription>
                  발생조건 체크 및 발생 데이터 전송 여부
                </FieldDescription>
              </FieldContent>
              <div className="w-full min-w-0 flex-1">
                <InputRenderer
                  type="checkbox"
                  value={process.evntCondition?.checkable ?? false}
                  onChange={(val) =>
                    onFieldChange('evntCondition.checkable', val)
                  }
                  error={false}
                />
              </div>
            </Field>
            <Field orientation="responsive" className="gap-4">
              <FieldContent className="w-full max-w-[280px] flex-none shrink-0">
                <FieldTitle className="text-foreground text-sm font-medium">
                  Event Condition Type
                </FieldTitle>
                <FieldDescription>이벤트 종류</FieldDescription>
              </FieldContent>
              <div className="w-full min-w-0 flex-1">
                <InputRenderer
                  type="select"
                  value={process.evntCondition?.type ?? ''}
                  onChange={(val) => onFieldChange('evntCondition.type', val)}
                  error={fieldErrors['evntCondition.type'] ?? false}
                  options={EVENT_TYPE_OPTIONS}
                />
              </div>
            </Field>
            <Field orientation="responsive" className="gap-4">
              <FieldContent className="w-full max-w-[280px] flex-none shrink-0">
                <FieldTitle className="text-foreground text-sm font-medium">
                  Control Statement
                </FieldTitle>
                <FieldDescription>결과 값이 치환할 변수 위치</FieldDescription>
              </FieldContent>
              <div className="w-full min-w-0 flex-1">
                <InputRenderer
                  type="text"
                  value={process.evntCondition?.expression?.ctrlStatement ?? ''}
                  onChange={(val) =>
                    onFieldChange('evntCondition.expression.ctrlStatement', val)
                  }
                  error={
                    fieldErrors['evntCondition.expression.ctrlStatement'] ??
                    false
                  }
                  placeholder={
                    '((#{DT-13} > 1 && #{DT-13} < 10) || (#{DT-23} > 90))'
                  }
                />
              </div>
            </Field>
          </FieldGroup>
        </div>
      </Field>

      <Field orientation="responsive" className="gap-4">
        <FieldContent
          className={'w-full md:w-[300px] md:flex-none md:shrink-0'}
        >
          <FieldTitle className="text-foreground text-sm font-medium">
            {FIELD_CONFIGS.evntOccrCnt.label}
          </FieldTitle>
          <FieldDescription>
            {FIELD_CONFIGS.evntOccrCnt.description}
          </FieldDescription>
        </FieldContent>
        <div className={'w-full md:min-w-0 md:flex-1'}>
          <InputRenderer
            type="number"
            value={process.evntOccrCnt}
            onChange={(val) => onFieldChange('evntOccrCnt', val)}
            error={fieldErrors['evntOccrCnt']}
            placeholder={'-1'}
          />
        </div>
      </Field>

      <Field orientation="responsive" className="gap-4">
        <FieldContent
          className={'w-full md:w-[300px] md:flex-none md:shrink-0'}
        >
          <FieldTitle className="text-foreground text-sm font-medium">
            Event End Date
          </FieldTitle>
          <FieldDescription>
            트래킹 이벤트 트래킹 시작 후 종료일(DATE) 까지 이벤트 전송
          </FieldDescription>
        </FieldContent>
        <div className={'w-full md:min-w-0 md:flex-1'}>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <InputRenderer
                type="number"
                value={process.evntEndDt.VALUE}
                onChange={(val) => onFieldChange('evntEndDt.VALUE', val)}
                error={fieldErrors['evntEndDt.VALUE']}
                placeholder="3"
              />
            </div>
            <div className="flex-1">
              <InputRenderer
                type="select"
                value={process.evntEndDt.INTERVAL}
                onChange={(val) => onFieldChange('evntEndDt.INTERVAL', val)}
                error={fieldErrors['evntEndDt.INTERVAL']}
                options={SELECT_OPTIONS.eventEndInterval}
              />
            </div>
          </div>
        </div>
      </Field>
    </>
  );
}

export default EventTrackingFields;
