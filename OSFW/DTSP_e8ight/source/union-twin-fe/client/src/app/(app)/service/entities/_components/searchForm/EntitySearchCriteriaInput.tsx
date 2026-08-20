import type { ChangeEvent } from 'react';

import { Field, FieldLabel } from '@e8ight/ui/components/ui/field';
import { Input } from '@e8ight/ui/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@e8ight/ui/components/ui/select';

import EntityDateTimePicker from '@/app/(app)/service/entities/_components/EntityDateTimePicker';
import InequlityInput from '@/app/(app)/service/entities/_components/searchForm/InequlityInput';
import { AttributeValueType } from '@/types/attribute';

import type {
  CriteriaInfoTypeList,
  SearchCriteriaInfoType,
} from '@/apis/entity';
import type { SelectOption } from '@/types/common';

interface IProps {
  label: string;
  searchCriteriaInfoList: CriteriaInfoTypeList;
  searchCriteriaInfo: SearchCriteriaInfoType;
  observedTimeProperty?: string;
  onChange: (nextSearchCriteriaInfo: SearchCriteriaInfoType) => void;
  disabled?: boolean;
}

function EntitySearchCriteriaInput({
  label,
  searchCriteriaInfoList,
  searchCriteriaInfo,
  observedTimeProperty,
  onChange,
  disabled,
}: IProps) {
  const dataList: SelectOption[] = searchCriteriaInfoList
    .filter((attribute) => attribute.criteria !== observedTimeProperty)
    .map((attribute) => {
      let itemLabel: string;

      if (attribute.criteria.includes('_id.id')) {
        itemLabel = 'Entity ID';
      } else if (attribute.criteria.includes('_id.servicePath')) {
        itemLabel = 'Provider';
      } else if (attribute.criteria.includes('.observedAt')) {
        itemLabel = 'Observed Time';
      } else {
        itemLabel = `${attribute.criteria} / ${attribute.valueType}`;
      }

      return {
        label: itemLabel,
        value: attribute.criteria,
      };
    });

  const eventHandler = {
    onChangeValue: (event: ChangeEvent<HTMLInputElement>) => {
      onChange({
        ...searchCriteriaInfo,
        value: event.target.value,
      });
    },
    onChangeSelectValue: (selectedValue: string) => {
      const targetCriteria =
        selectedValue === '--'
          ? undefined
          : searchCriteriaInfoList.find(
              (attribute) => attribute.criteria === selectedValue,
            );

      onChange({
        criteria: targetCriteria?.criteria ?? '',
        valueType: targetCriteria?.valueType ?? '',
        value: '',
      });
    },
  };

  const renderValueField = () => {
    if (!searchCriteriaInfo || searchCriteriaInfo.valueType.length === 0) {
      return (
        <Field className="gap-1.5">
          <FieldLabel className="text-muted-foreground font-bold tracking-[0.07em] uppercase">
            Value
          </FieldLabel>
          <Input
            type="text"
            value=""
            placeholder="Select a filter field first"
            disabled
          />
        </Field>
      );
    }

    switch (searchCriteriaInfo.valueType) {
      case AttributeValueType.String:
      case AttributeValueType.Enum:
        return (
          <Field className="gap-1.5">
            <FieldLabel className="text-muted-foreground font-bold tracking-[0.07em] uppercase">
              Value
            </FieldLabel>
            <Input
              type="text"
              placeholder="Enter a value"
              value={searchCriteriaInfo.value}
              onChange={eventHandler.onChangeValue}
            />
          </Field>
        );
      case AttributeValueType.DateTime:
        return (
          <Field className="gap-1.5">
            <FieldLabel className="text-muted-foreground font-bold tracking-[0.07em] uppercase">
              Value
            </FieldLabel>
            <EntityDateTimePicker
              value={searchCriteriaInfo.value}
              onChange={(value) =>
                onChange({
                  ...searchCriteriaInfo,
                  value,
                })
              }
              placeholder="Select date and time"
            />
          </Field>
        );
      case AttributeValueType.Integer:
      case AttributeValueType.Double:
        return (
          <Field className="gap-1.5">
            <FieldLabel className="text-muted-foreground font-bold tracking-[0.07em] uppercase">
              Range
            </FieldLabel>
            <InequlityInput
              value={searchCriteriaInfo.value}
              onChange={(value) =>
                onChange({
                  ...searchCriteriaInfo,
                  value,
                })
              }
            />
          </Field>
        );
      default:
        return (
          <Field className="gap-1.5">
            <FieldLabel className="text-muted-foreground font-bold tracking-[0.07em] uppercase">
              Value
            </FieldLabel>
            <Input
              type="text"
              value=""
              placeholder="Search is not supported for this field."
              disabled
            />
          </Field>
        );
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <Field className="gap-1.5">
        <FieldLabel className="text-muted-foreground font-bold tracking-[0.07em] uppercase">
          {label}
        </FieldLabel>
        <Select
          value={searchCriteriaInfo.criteria || '--'}
          onValueChange={eventHandler.onChangeSelectValue}
          disabled={disabled}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a field" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="--">--</SelectItem>
            {dataList.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      {renderValueField()}
    </div>
  );
}

export default EntitySearchCriteriaInput;
