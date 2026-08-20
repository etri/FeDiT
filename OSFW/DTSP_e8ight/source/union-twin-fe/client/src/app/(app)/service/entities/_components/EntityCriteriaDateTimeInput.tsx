import { Field, FieldLabel } from '@e8ight/ui/components/ui/field';
import { Input } from '@e8ight/ui/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@e8ight/ui/components/ui/select';
import { toast } from '@e8ight/ui/components/ui/sonner';

import EntityDateTimePicker from '@/app/(app)/service/entities/_components/EntityDateTimePicker';
import InequlityInput from '@/app/(app)/service/entities/_components/searchForm/InequlityInput';
import { createDefaultObservedTimeInfo } from '@/app/(app)/service/entities/_utils/searchInfo';
import { AttributeValueType } from '@/types/attribute';

import type {
  CriteriaInfoTypeList,
  ObservedTimeInfoType,
  TimerelType,
} from '@/apis/entity';
import type { SelectOption } from '@/types/common';

interface IProps {
  label: string;
  timePropertyList: string[];
  searchCriteriaInfoList: CriteriaInfoTypeList;
  observedTimeInfo: ObservedTimeInfoType;
  onChange: (nextObservedTimeInfo: ObservedTimeInfoType) => void;
}

function getTimerel(
  startTime: string,
  endTime: string,
): TimerelType | undefined {
  if (
    startTime.length !== 0 &&
    endTime.length !== 0 &&
    new Date(startTime) > new Date(endTime)
  ) {
    throw new Error('Start time must be earlier than end time.');
  }

  if (startTime.length !== 0 && endTime.length !== 0) {
    return 'between';
  }

  if (startTime.length !== 0) {
    return 'after';
  }

  if (endTime.length !== 0) {
    return 'before';
  }

  return undefined;
}

function EntityCriteriaDateTimeInput({
  label,
  timePropertyList,
  searchCriteriaInfoList,
  observedTimeInfo,
  onChange,
}: IProps) {
  const dataList: SelectOption[] = searchCriteriaInfoList
    .filter((attribute) => timePropertyList.includes(attribute.criteria))
    .map((attribute) => {
      return {
        label: `${attribute.criteria} / ${attribute.valueType}`,
        value: attribute.criteria,
      };
    });

  const updatePeriod = (
    key: 'startTime' | 'endTime',
    nextValue: string,
    oppositeValue: string,
  ) => {
    try {
      const timerel = getTimerel(
        key === 'startTime' ? nextValue : oppositeValue,
        key === 'endTime' ? nextValue : oppositeValue,
      );

      onChange({
        ...observedTimeInfo,
        [key]: nextValue,
        timerel,
      });
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleSelectValue = (selectedValue: string) => {
    const targetProperty = searchCriteriaInfoList.find(
      (attribute) => attribute.criteria === selectedValue,
    );

    if (!targetProperty) {
      return;
    }

    onChange(
      createDefaultObservedTimeInfo(
        targetProperty.criteria,
        targetProperty.valueType,
      ),
    );
  };

  const updateValue = (value: string) =>
    onChange({ ...observedTimeInfo, value });

  return (
    <div className="grid grid-cols-2 gap-3">
      <Field className="gap-1.5">
        <FieldLabel className="text-muted-foreground font-bold tracking-[0.07em] uppercase">
          {label}
        </FieldLabel>
        <Select
          value={observedTimeInfo.property}
          onValueChange={handleSelectValue}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a field" />
          </SelectTrigger>
          <SelectContent>
            {dataList.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field className="gap-1.5">
        <FieldLabel className="text-muted-foreground font-bold tracking-[0.07em] uppercase">
          Value
        </FieldLabel>
        {observedTimeInfo.property &&
        observedTimeInfo.valueType.length !== 0 ? (
          (() => {
            switch (observedTimeInfo.valueType) {
              case AttributeValueType.String:
              case AttributeValueType.Enum:
                return (
                  <Input
                    type="text"
                    placeholder="Enter a value"
                    value={observedTimeInfo.value}
                    onChange={(e) => updateValue(e.target.value)}
                  />
                );
              case AttributeValueType.Integer:
              case AttributeValueType.Double:
                return (
                  <InequlityInput
                    value={observedTimeInfo.value}
                    onChange={updateValue}
                  />
                );
              default:
                return (
                  <Input
                    type="text"
                    value=""
                    placeholder="Search is not supported for this field."
                    disabled
                  />
                );
            }
          })()
        ) : (
          <Input
            type="text"
            value=""
            placeholder="Choose an observed time field first"
            disabled
          />
        )}
      </Field>
      <Field className="col-span-2 gap-1.5">
        <FieldLabel className="text-muted-foreground font-bold tracking-[0.07em] uppercase">
          Period
        </FieldLabel>
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-3">
          <EntityDateTimePicker
            value={observedTimeInfo.startTime}
            onChange={(nextStartTime) =>
              updatePeriod('startTime', nextStartTime, observedTimeInfo.endTime)
            }
            placeholder="Start date and time"
          />
          <span className="text-muted-foreground flex items-center justify-center text-sm">
            ~
          </span>
          <EntityDateTimePicker
            value={observedTimeInfo.endTime}
            onChange={(nextEndTime) =>
              updatePeriod('endTime', nextEndTime, observedTimeInfo.startTime)
            }
            placeholder="End date and time"
          />
        </div>
      </Field>
    </div>
  );
}

export default EntityCriteriaDateTimeInput;
