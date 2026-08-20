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

import ObjectMember from '@/app/(app)/service/models/_components/dataModelAttributeContent/ObjectMember';
import EditableList from '@/app/(app)/service/models/_components/EditableList';
import { useDataModelStore } from '@/app/(app)/service/models/_stores/useDataModelStore';
import { GEO_PROPERTY_VALUE_TYPES } from '@/constants/dataModelValueTypes';

import type { DataModelAttribute } from '@/types/dataModel';

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

  const handleModelTypeChange: Dispatch<
    SetStateAction<string[] | undefined>
  > = (v) => {
    const next = typeof v === 'function' ? v(value.modelType) : v;
    setValue({ modelType: next });
  };

  const handleMemberChange = useCallback(
    (v: Record<string, unknown>) => setValue({ objectMember: v }),
    [setValue],
  );

  return (
    <div className="space-y-4 overflow-auto p-4">
      <Field>
        <FieldLabel>Type</FieldLabel>
        <Input readOnly value={value.type ?? ''} />
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
        <EditableList
          key={`${keyId}-modelType`}
          label="model Type"
          setState={handleModelTypeChange}
          propValue={value.modelType || []}
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
