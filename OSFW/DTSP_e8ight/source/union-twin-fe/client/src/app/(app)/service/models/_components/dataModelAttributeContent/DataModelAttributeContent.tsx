import type { Dispatch, SetStateAction } from 'react';
import { useCallback } from 'react';

import { Field, FieldLabel } from '@e8ight/ui/components/ui/field';
import { Input } from '@e8ight/ui/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@e8ight/ui/components/ui/select';

import ModelTypeSelector from '@/app/(app)/service/models/_components/dataModelAttributeContent/ModelTypeSelector';
import ObjectMember from '@/app/(app)/service/models/_components/dataModelAttributeContent/ObjectMember';
import EditableList from '@/app/(app)/service/models/_components/EditableList';
import { useDataModelStore } from '@/app/(app)/service/models/_stores/useDataModelStore';
import {
  ATTRIBUTE_TYPES,
  GEO_PROPERTY_VALUE_TYPES,
} from '@/constants/dataModelValueTypes';

import type { AttributeType, DataModelAttribute } from '@/types/dataModel';

function attributeTypeDefaults(
  type: AttributeType,
): Partial<DataModelAttribute> {
  switch (type) {
    case 'Relationship':
      return { type, valueType: 'String', format: undefined, modelType: [] };
    case 'GeoProperty':
      return {
        type,
        valueType: 'POINT',
        format: 'GeoJSON',
        modelType: undefined,
      };
    default:
      return {
        type,
        valueType: 'String',
        format: undefined,
        modelType: undefined,
      };
  }
}

function DataModelAttributeContent({
  keyId,
  value,
  setValue,
}: {
  keyId: string;
  value: DataModelAttribute;
  setValue: (value: Partial<DataModelAttribute>) => void;
}) {
  const editMode = useDataModelStore((s) => s.editMode);
  const handleEnumChange: Dispatch<SetStateAction<string[] | undefined>> = (
    v,
  ) => {
    const next = typeof v === 'function' ? v(value.enum) : v;
    setValue({ enum: next });
  };

  const handleMemberChange = useCallback(
    (v: Record<string, unknown>) => setValue({ objectMember: v }),
    [setValue],
  );

  return (
    <div className="space-y-4 overflow-auto p-4">
      <Field>
        <FieldLabel>Type</FieldLabel>
        {editMode ? (
          <Select
            value={value.type ?? 'Property'}
            onValueChange={(v) =>
              setValue(attributeTypeDefaults(v as AttributeType))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ATTRIBUTE_TYPES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input readOnly value={value.type ?? ''} />
        )}
      </Field>
      <Field>
        <FieldLabel>Description</FieldLabel>
        <Input readOnly value={value.description ?? ''} />
      </Field>
      <Field>
        <FieldLabel>Value Type</FieldLabel>
        {value.type === 'GeoProperty' &&
        value.format === 'GeoJSON' &&
        editMode ? (
          <Select
            value={value.valueType}
            onValueChange={(v) =>
              setValue({ valueType: v as DataModelAttribute['valueType'] })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GEO_PROPERTY_VALUE_TYPES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input readOnly value={value.valueType ?? ''} />
        )}
      </Field>
      {value.format !== undefined && (
        <Field>
          <FieldLabel>Format</FieldLabel>
          <Input readOnly value={value.format ?? ''} />
        </Field>
      )}
      {value.type === 'Relationship' && (
        <ModelTypeSelector
          key={`${keyId}-modelType`}
          label="model Type"
          value={value.modelType ?? []}
          onChange={(next) => setValue({ modelType: next })}
          isUnable={!editMode}
        />
      )}
      <EditableList
        key={`${keyId}-enum`}
        label="Enum"
        setState={handleEnumChange}
        propValue={value.enum}
        isUnable={!editMode}
      />
      {value.valueType === 'Object' && (
        <>
          <FieldLabel>Object Member</FieldLabel>
          <ObjectMember
            key={keyId}
            setMember={handleMemberChange}
            propValue={value.objectMember}
          />
        </>
      )}
    </div>
  );
}

export default DataModelAttributeContent;
